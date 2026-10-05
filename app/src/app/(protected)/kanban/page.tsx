"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { KanbanBoard, KanbanTask } from "@/components/kanban/KanbanBoard";
import { TaskModal } from "@/components/kanban/TaskModal";
import { TaskDetailModal } from "@/components/kanban/TaskDetailModal";
import { TaskTableView } from "@/components/kanban/TaskTableView";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { CheckSquare, Eye, User as UserIcon, Plus, LayoutGrid, TableProperties } from "lucide-react";

/**
 * Page Tâches interactive avec support double-vue : Kanban et Tableau exhaustif M2V5.
 * Permet l'ouverture d'un panneau d'édition au clic pour le titulaire ou les binômes.
 */
export default function KanbanPage() {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  // Déterminer l'ID utilisateur courant (depuis session ou correspondance email)
  const [resolvedUserId, setResolvedUserId] = useState<string>(session?.user?.id || "");

  const {
    tasks,
    users,
    isLoading,
    handleTaskMove,
    handleTaskUpdate,
    handleCreateTask,
    handleDeleteTask,
  } = useTasks(showAll, isAdmin, resolvedUserId);

  // Synchronisation continue de l'ID utilisateur dès que la liste des utilisateurs est reçue
  React.useEffect(() => {
    if (session?.user?.id) {
      setResolvedUserId(session.user.id);
    } else if (session?.user?.email && users.length > 0) {
      const match = users.find(
        (u) => u.email.toLowerCase() === session.user.email?.toLowerCase()
      );
      if (match) {
        setResolvedUserId(match.id);
      }
    }
  }, [session, users]);

  const currentUserId = resolvedUserId || session?.user?.id || "";

  // Ouverture du panneau de détails/modification au clic sur une tâche
  const handleTaskClick = useCallback((task: KanbanTask) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  }, []);

  const handleUpdateFromModal = useCallback(
    async (taskId: string, payload: any) => { // eslint-disable-line
      await handleTaskUpdate(taskId, payload);
      handleCloseDetailModal();
    },
    [handleTaskUpdate, handleCloseDetailModal]
  );

  const handleDeleteFromModal = useCallback(
    async (taskId: string) => {
      await handleDeleteTask(taskId);
      handleCloseDetailModal();
    },
    [handleDeleteTask, handleCloseDetailModal]
  );

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec sélecteurs de vue et filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tâches & Suivi</h1>
            <p className="text-muted-foreground text-sm">
              {showAll
                ? `Vue globale de toute l'équipe (${tasks.length} tâche${tasks.length > 1 ? "s" : ""})`
                : `Vos tâches assignées (${tasks.length} tâche${tasks.length > 1 ? "s" : ""})`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de mode de vue (Kanban vs Tableau M2V5) */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="gap-1.5 h-8 text-xs"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="gap-1.5 h-8 text-xs"
            >
              <TableProperties className="h-3.5 w-3.5" />
              Tableau M2V5
            </Button>
          </div>

          {/* Sélecteur de périmètre (Toutes les tâches vs Mes tâches) */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40">
            <Button
              variant={showAll ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowAll(true)}
              className="gap-1.5 h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Toutes les tâches
            </Button>
            <Button
              variant={!showAll ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowAll(false)}
              className="gap-1.5 h-8 text-xs"
            >
              <UserIcon className="h-3.5 w-3.5" />
              Mes tâches
            </Button>
          </div>

          {/* Bouton création (Tous) */}
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" /> Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Affichage conditionnel selon le mode sélectionné */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onTaskDelete={handleDeleteTask}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ) : (
        <TaskTableView
          tasks={tasks}
          users={users}
          onUpdate={(taskId, data) => handleTaskUpdate(taskId, data)}
          onCreate={handleCreateTask}
          onDelete={handleDeleteTask}
          onTaskClick={handleTaskClick}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}

      {/* Modale de création d'une nouvelle tâche */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        users={users}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />

      {/* Panneau / Modale de consultation et modification d'une tâche cliquée */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        task={selectedTask}
        users={users}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onUpdate={handleUpdateFromModal}
        onDelete={handleDeleteFromModal}
      />
    </div>
  );
}
