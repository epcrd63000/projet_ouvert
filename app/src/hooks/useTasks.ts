"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
 * Gère l'étanchéité stricte de 'Mes tâches' par rapport à la vue globale et la réactivité du Dashboard.
 */
export function useTasks(
  showAll: boolean,
  isAdmin: boolean = false,
  currentUserId?: string
) {
  const router = useRouter();
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
   * Met à jour immédiatement le statut individuel de l'assigné et rafraîchit le cache Next.js.
   */
  const handleTaskMove = useCallback(
    async (taskId: string, newStatus: string, newPosition: number) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const updatedAssignments = t.assignments?.map((a) =>
            a.user.id === currentUserId ? { ...a, status: newStatus as KanbanTask["status"] } : a
          );
          return {
            ...t,
            status: !showAll ? (newStatus as KanbanTask["status"]) : t.status,
            position: newPosition,
            assignments: updatedAssignments,
          };
        })
      );

      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, position: newPosition }),
        });
        // Invalidation instantanée du cache client pour le Dashboard
        router.refresh();
      } catch (error) {
        console.error("Erreur déplacement tâche:", error);
        fetchTasks();
      }
    },
    [fetchTasks, currentUserId, showAll, router]
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
          router.refresh();
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
    [fetchTasks, router]
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
          router.refresh();
        }
      } catch (error) {
        console.error("Erreur création tâche:", error);
      }
    },
    [fetchTasks, router]
  );

  /**
   * Supprime une tâche ou désassigne l'utilisateur courant selon la règle collective.
   */
  const handleDeleteTask = useCallback(
    async (taskId: string, requestedAction?: "unassign" | "delete") => {
      const task = tasks.find((t) => t.id === taskId);
      const isMulti = (task?.assignments?.length || 0) > 1;

      let action = requestedAction;
      if (!action) {
        if (isMulti) {
          if (isAdmin) {
            const shouldUnassign = confirm(
              "Cette tâche est partagée avec d'autres membres.\n\n" +
              "• Cliquez sur 'OK' pour vous retirer uniquement de la tâche.\n" +
              "• Cliquez sur 'Annuler' si vous préférez la supprimer définitivement pour tout le monde (une confirmation suivra)."
            );
            if (shouldUnassign) {
              action = "unassign";
            } else {
              const confirmAll = confirm(
                "⚠️ ATTENTION : Voulez-vous vraiment supprimer définitivement cette tâche pour TOUTE l'équipe ?"
              );
              if (confirmAll) {
                action = "delete";
              } else {
                return;
              }
            }
          } else {
            const confirmUnassign = confirm(
              "Cette tâche est partagée avec vos coéquipiers.\n\n" +
              "Voulez-vous vous retirer de cette tâche ? Votre nom sera retiré mais la tâche restera pour les autres membres."
            );
            if (!confirmUnassign) return;
            action = "unassign";
          }
        } else {
          if (!confirm("Voulez-vous vraiment supprimer définitivement cette tâche ?")) return;
          action = "delete";
        }
      }

      try {
        const url = `/api/tasks/${taskId}${action ? `?action=${action}` : ""}`;
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
          const result = await res.json();
          if (result.action === "UNASSIGN") {
            if (!showAll) {
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
            } else {
              fetchTasks();
            }
          } else {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
          }
          router.refresh();
        } else {
          console.error("Erreur suppression tâche:", await res.text());
        }
      } catch (error) {
        console.error("Erreur suppression tâche:", error);
      }
    },
    [tasks, isAdmin, showAll, fetchTasks, router]
  );

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
