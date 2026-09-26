"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KanbanTask } from "./KanbanBoard";

/**
 * Couleurs des badges de priorité.
 */
const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-500/20 text-slate-400",
  NORMAL: "bg-blue-500/20 text-blue-400",
  HIGH: "bg-orange-500/20 text-orange-400",
  CRITICAL: "bg-red-500/20 text-red-400",
};

/**
 * Labels de priorité en français.
 */
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

interface TaskCardProps {
  task: KanbanTask;
  isDragging?: boolean;
  onClick?: () => void;
}

/**
 * Carte draggable représentant une tâche dans le Kanban.
 * Affiche titre, priorité, assignés et date d'échéance.
 */
export function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  // Vérifier si la tâche est en retard
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card
        className={cn(
          "cursor-grab transition-shadow hover:shadow-md",
          isDragging && "opacity-50 shadow-lg rotate-2",
          isOverdue && "border-red-500/50"
        )}
        onClick={onClick}
      >
        <CardContent className="space-y-2 p-3">
          {/* Titre */}
          <p className="text-sm font-medium leading-tight">{task.title}</p>

          {/* Priorité + date */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", PRIORITY_STYLES[task.priority])}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {task.dueDate && (
              <span className={cn("text-xs text-muted-foreground", isOverdue && "text-red-400")}>
                {new Date(task.dueDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>

          {/* Avatars des assignés */}
          {task.assignments.length > 0 && (
            <div className="flex items-center gap-1">
              {task.assignments.map((a) => (
                <span
                  key={a.user.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary"
                  title={a.user.name}
                >
                  {a.user.name.charAt(0).toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
