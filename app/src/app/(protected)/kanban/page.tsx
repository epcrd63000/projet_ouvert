"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { KanbanBoard, KanbanTask } from "@/components/kanban/KanbanBoard";
import { TaskModal, TaskFormData } from "@/components/kanban/TaskModal";
import { Button } from "@/components/ui/button";
import { CheckSquare, Eye, User as UserIcon, Plus } from "lucide-react";
import { getUpcomingMeetings, ScheduledMeeting } from "@/lib/meeting-options";

interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Page Kanban interactive avec drag & drop.
 * Affiche les tâches de l'utilisateur connecté (ou toutes si Admin + vue globale).
 */
export default function KanbanPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<ScheduledMeeting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignToOthers, setIsAssignToOthers] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = session?.user?.role === "ADMIN";

  /**
   * Charge les tâches depuis l'API.
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
   * Charge la liste des utilisateurs pour la modale de création.
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

  const fetchUpcomingMeetings = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const meetings: ScheduledMeeting[] = await res.json();
        setUpcomingMeetings(getUpcomingMeetings(meetings));
      }
    } catch (error) {
      console.error("Erreur chargement réunions à venir:", error);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchUpcomingMeetings();
  }, [fetchTasks, fetchUsers, fetchUpcomingMeetings]);

  /**
   * Déplace une tâche (mise à jour optimiste du statut et de la position).
   */
  const handleTaskMove = useCallback(
    async (taskId: string, newStatus: string, newPosition: number) => {
      // Mise à jour optimiste
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus as KanbanTask["status"], position: newPosition }
            : t
        )
      );

      // Appel API
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, position: newPosition }),
        });
      } catch (error) {
        console.error("Erreur déplacement tâche:", error);
        fetchTasks(); // Rollback en cas d'erreur
      }
    },
    [fetchTasks]
  );

  /**
   * Crée une nouvelle tâche via l'API.
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

        if (!res.ok) {
          const responseError = await res.json().catch(() => null);
          throw new Error(
            responseError?.error ??
              "Impossible de créer la tâche. Vérifiez les informations et réessayez."
          );
        }

        const createdTask: KanbanTask = await res.json();
        const isVisibleInCurrentView =
          (isAdmin && showAll) ||
          createdTask.assignments.some((assignment) => assignment.user.id === session?.user?.id);
        if (isVisibleInCurrentView) {
          setTasks((previousTasks) =>
            previousTasks.some((task) => task.id === createdTask.id)
              ? previousTasks
              : [...previousTasks, createdTask]
          );
        }

        await fetchTasks();
      } catch (error) {
        console.error("Erreur création tâche:", error);
        throw error;
      }
    },
    [fetchTasks, isAdmin, showAll, session?.user?.id]
  );

  const handleTaskClick = useCallback((task: KanbanTask) => {
    console.log("Tâche sélectionnée:", task.id);
    // TODO Sprint futur : ouvrir la fiche détail de la tâche
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mes Tâches</h1>
            <p className="text-muted-foreground">
              {showAll ? "Vue globale de toutes les tâches" : "Vos tâches assignées"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignToOthers(true);
                setIsModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Tâche pour un membre
            </Button>
          )}
          {/* Toggle vue globale (Admin) */}
          {isAdmin && (
            <Button
              variant={showAll ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="gap-2"
            >
              {showAll ? <Eye className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
              {showAll ? "Vue globale" : "Mes tâches"}
            </Button>
          )}
          {/* Création de tâche pour soi, accessible à tous */}
          <Button
            onClick={() => {
              setIsAssignToOthers(false);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Tableau Kanban */}
      <KanbanBoard
        tasks={tasks}
        onTaskMove={handleTaskMove}
        onTaskClick={handleTaskClick}
      />

      {/* Modale de création */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        users={users}
        upcomingMeetings={upcomingMeetings}
        currentUserId={session?.user?.id || ""}
        isAdmin={isAdmin}
        assignToOthers={isAssignToOthers}
      />
    </div>
  );
}
