"use client";

import { useState, useEffect, useCallback } from "react";
import type { KanbanTask } from "@/components/kanban/KanbanBoard";
import type { TaskFormData } from "@/components/kanban/TaskModal";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

/**
 * Hook personnalisé encapsulant la gestion de l'état et des opérations CRUD sur les tâches.
 */
export function useTasks(showAll: boolean, isAdmin: boolean) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Récupère les tâches depuis l'API.
   */
  const fetchTasks = useCallback(async () => {
    try {
      const url = showAll && isAdmin ? "/api/tasks?all=true" : "/api/tasks";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Erreur chargement tâches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showAll, isAdmin]);

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
   * Met à jour les champs d'une tâche (avancement, statut, cause de retard, etc.).
   */
  const handleTaskUpdate = useCallback(
    async (taskId: string, data: Partial<KanbanTask>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...data } : t))
      );

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
          );
        } else {
          fetchTasks();
        }
      } catch (error) {
        console.error("Erreur mise à jour tâche:", error);
        fetchTasks();
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
