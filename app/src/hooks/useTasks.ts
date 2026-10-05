"use client";

import { useState, useEffect, useCallback } from "react";
import type { KanbanTask } from "@/components/kanban/KanbanBoard";
import type { TaskFormData } from "@/components/kanban/TaskModal";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export type TaskUpdatePayload = Partial<KanbanTask> & {
  assigneeIds?: string[];
};

/**
 * Hook personnalisé encapsulant la gestion de l'état et des opérations CRUD sur les tâches.
 * Gère l'étanchéité stricte de 'Mes tâches' par rapport à la vue globale.
 */
export function useTasks(
  showAll: boolean,
  isAdmin: boolean = false,
  currentUserId?: string
) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Récupère les tâches depuis l'API avec filtrage par périmètre.
   */
  const fetchTasks = useCallback(async () => {
    try {
      let url = "/api/tasks";
      if (showAll) {
        url = "/api/tasks?all=true";
      } else if (currentUserId && currentUserId.trim() !== "") {
        url = `/api/tasks?userId=${encodeURIComponent(currentUserId)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data: KanbanTask[] = await res.json();
        // Filtrage défensif côté client pour garantir l'étanchéité absolue de 'Mes tâches'
        if (!showAll && currentUserId && currentUserId.trim() !== "") {
          const filtered = data.filter((t) =>
            t.assignments?.some((a) => a.user.id === currentUserId)
          );
          setTasks(filtered);
        } else {
          setTasks(data);
        }
      }
    } catch (error) {
      console.error("Erreur chargement tâches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showAll, currentUserId]);

  /**
   * Récupère la liste des utilisateurs pour les assignations.
   */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  /**
   * Déplace une tâche (drag & drop Kanban).
   */
  const handleTaskMove = useCallback(
    async (taskId: string, newStatus: string, newPosition: number) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus as KanbanTask["status"], position: newPosition }
            : t
        )
      );

      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, position: newPosition }),
        });
      } catch (error) {
        console.error("Erreur déplacement tâche:", error);
        fetchTasks();
      }
    },
    [fetchTasks]
  );

  /**
   * Met à jour les champs d'une tâche (titre, avancement, assignés, cause de retard, etc.).
   */
  const handleTaskUpdate = useCallback(
    async (taskId: string, data: TaskUpdatePayload) => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const updated: KanbanTask = await res.json();
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
          );
          return updated;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Erreur mise à jour tâche:", errData);
          fetchTasks();
          throw new Error(errData.error || "Erreur lors de la mise à jour");
        }
      } catch (error) {
        console.error("Erreur mise à jour tâche:", error);
        fetchTasks();
        throw error;
      }
    },
    [fetchTasks]
  );

  /**
   * Crée une nouvelle tâche.
   */
  const handleCreateTask = useCallback(
    async (data: TaskFormData) => {
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          }),
        });

        if (res.ok) {
          fetchTasks();
        }
      } catch (error) {
        console.error("Erreur création tâche:", error);
      }
    },
    [fetchTasks]
  );

  /**
   * Supprime une tâche.
   */
  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        console.error("Erreur suppression tâche:", await res.text());
      }
    } catch (error) {
      console.error("Erreur suppression tâche:", error);
    }
  }, []);

  return {
    tasks,
    users,
    isLoading,
    fetchTasks,
    handleTaskMove,
    handleTaskUpdate,
    handleCreateTask,
    handleDeleteTask,
  };
}
