"use client";

import React, { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { KanbanBoard, KanbanTask } from "@/components/kanban/KanbanBoard";
import { TaskModal } from "@/components/kanban/TaskModal";
import { TaskTableView } from "@/components/kanban/TaskTableView";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { CheckSquare, Eye, User as UserIcon, Plus, LayoutGrid, TableProperties } from "lucide-react";

/**
 * Page Tâches interactive avec support double-vue : Kanban et Tableau exhaustif M2V5.
 */
export default function KanbanPage() {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const {
    tasks,
    users,
    isLoading,
    handleTaskMove,
    handleTaskUpdate,
    handleCreateTask,
    handleDeleteTask,
  } = useTasks(showAll, isAdmin);

  // Déterminer l'ID utilisateur courant (depuis session ou correspondance email)
  const currentUserId =
    session?.user?.id ||
    users.find((u) => u.email.toLowerCase() === session?.user?.email?.toLowerCase())?.id ||
    "";

  const handleTaskClick = useCallback((task: KanbanTask) => {
    console.log("Tâche sélectionnée:", task.id);
  }, []);

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
            <p className="text-muted-foreground">
              {showAll ? "Vue globale de toutes les tâches de l'équipe" : "Vos tâches assignées et créées"}
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

          {/* Toggle vue globale (Admin) */}
          {isAdmin && (
            <Button
              variant={showAll ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="gap-1.5 h-8 text-xs"
            >
              {showAll ? <Eye className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
              {showAll ? "Vue globale" : "Mes tâches"}
            </Button>
          )}

          {/* Bouton création (Tous) */}
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-1.5 h-8 text-xs">
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
          onUpdate={handleTaskUpdate}
          onDelete={handleDeleteTask}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}

      {/* Modale de création */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        users={users}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
