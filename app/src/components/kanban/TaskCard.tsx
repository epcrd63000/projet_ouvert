"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import type { KanbanTask } from "./KanbanBoard";

/**
 * Couleurs des badges de priorité.
 */
const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  NORMAL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
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

/**
 * Configuration visuelle des pastilles de statut par assigné.
 */
const ASSIGNEE_STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  TODO: { dot: "bg-slate-400", label: "À faire" },
  IN_PROGRESS: { dot: "bg-amber-400", label: "En cours" },
  DONE: { dot: "bg-emerald-400", label: "Terminée" },
  BLOCKED: { dot: "bg-red-500", label: "Bloquée" },
};

interface TaskCardProps {
  task: KanbanTask;
  isDragging?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

/**
 * Carte draggable représentant une tâche dans le Kanban.
 * Affiche titre, priorité, date d'échéance et les assignés avec leur statut individuel en temps réel.
 */
export function TaskCard({ task, isDragging, onClick, onDelete, canDelete = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  // Vérifier si la tâche est en retard
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const isMultiAssigned = (task.assignments?.length || 0) > 1;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card
        className={cn(
          "group relative cursor-pointer transition-all hover:shadow-md hover:border-primary/50 border bg-card",
          isDragging && "opacity-50 shadow-lg rotate-2 cursor-grabbing",
          isOverdue && "border-red-500/50"
        )}
        onClick={onClick}
      >
        <CardContent className="space-y-2.5 p-3">
          {/* Titre et actions */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug flex-1 group-hover:text-primary transition-colors">
              {task.title}
            </p>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                title="Modifier les détails de la tâche"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted"
                  title={
                    isMultiAssigned
                      ? "Se retirer de la tâche (ou supprimer)"
                      : "Supprimer définitivement la tâche"
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Description optionnelle */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Priorité + date */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[11px] px-1.5 py-0 font-medium", PRIORITY_STYLES[task.priority])}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {task.dueDate && (
              <span className={cn("text-xs text-muted-foreground", isOverdue && "text-red-400 font-semibold")}>
                📅 {new Date(task.dueDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>

          {/* Noms et pastilles d'avancement individuel des membres assignés */}
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-1.5">
            {task.assignments && task.assignments.length > 0 ? (
              task.assignments.map((a) => {
                const statusMeta = ASSIGNEE_STATUS_CONFIG[a.status || "TODO"] || ASSIGNEE_STATUS_CONFIG.TODO;
                return (
                  <div
                    key={a.user.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-border px-2 py-0.5 text-xs font-medium text-foreground"
                    title={`${a.user.name} : ${statusMeta.label}`}
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0 shadow-sm", statusMeta.dot)} />
                    <span>{a.user.name}</span>
                  </div>
                );
              })
            ) : task.createdBy ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[9px] font-medium">
                  {task.createdBy.name.charAt(0).toUpperCase()}
                </span>
                <span>Créé par {task.createdBy.name}</span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">Non assignée</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
