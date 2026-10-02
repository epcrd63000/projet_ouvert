"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";

/**
 * Type complet d'une tâche pour l'affichage Kanban.
 */
export interface KanbanTask {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  position: number;
  dueDate: string | null;
  workload?: string | null;
  deliverables?: string | null;
  validationCriteria?: string | null;
  progress?: number;
  delayReason?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  assignments: {
    user: { id: string; name: string; email: string; avatarUrl?: string | null };
  }[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Définition des colonnes du Kanban.
 */
const COLUMNS = [
  { id: "TODO", title: "À faire", color: "border-t-blue-500" },
  { id: "IN_PROGRESS", title: "En cours", color: "border-t-yellow-500" },
  { id: "DONE", title: "Terminée", color: "border-t-green-500" },
  { id: "BLOCKED", title: "Bloquée", color: "border-t-red-500" },
] as const;

interface KanbanBoardProps {
  tasks: KanbanTask[];
  onTaskMove: (taskId: string, newStatus: string, newPosition: number) => void;
  onTaskClick?: (task: KanbanTask) => void;
  onTaskDelete?: (taskId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

/**
 * Tableau Kanban complet avec drag & drop entre colonnes.
 */
export function KanbanBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  onTaskDelete,
  currentUserId,
  isAdmin = false,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Déterminer la colonne de destination
      const isColumn = COLUMNS.some((col) => col.id === overId);
      const newStatus = isColumn
        ? overId
        : tasks.find((t) => t.id === overId)?.status || "";

      if (!newStatus) return;

      // Calculer la nouvelle position
      const columnTasks = tasks
        .filter((t) => t.status === newStatus && t.id !== taskId)
        .sort((a, b) => a.position - b.position);

      const newPosition = columnTasks.length;
      onTaskMove(taskId, newStatus, newPosition);
    },
    [tasks, onTaskMove]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnTasks = tasks
            .filter((t) => t.status === column.id)
            .sort((a, b) => a.position - b.position);

          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={columnTasks.length}
            >
              {columnTasks.map((task) => {
                const canDelete = Boolean(
                  isAdmin ||
                  (currentUserId && task.createdById === currentUserId) ||
                  (currentUserId && task.assignments?.some((a) => a.user.id === currentUserId))
                );

                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                    onDelete={onTaskDelete ? () => onTaskDelete(task.id) : undefined}
                    canDelete={canDelete}
                  />
                );
              })}
            </KanbanColumn>
          );
        })}
      </div>

      {/* Overlay affiché pendant le drag */}
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
