"use client";

import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isTaskOverdue, canUserEditTask } from "@/lib/m2v5/m2v5Logic";
import {
  EditableTextCell,
  EditablePriorityCell,
  EditableProgressCell,
  EditableDelayCell,
} from "./TaskTableCells";
import { TaskTableDeleteDialog } from "./TaskTableDeleteDialog";
import type { KanbanTask } from "../KanbanBoard";
import type { UserSummary } from "@/hooks/useTasks";

interface ColumnOptions {
  onUpdate: (taskId: string, data: Partial<KanbanTask>) => Promise<void>;
  onDelete?: (taskId: string) => void;
  users: UserSummary[];
  currentUserId: string;
  isAdmin: boolean;
}

const columnHelper = createColumnHelper<KanbanTask>();

/**
 * Génère les colonnes configurées TanStack Table pour le tableau de bord M2V5.
 */
export function createTaskColumns({
  onUpdate,
  onDelete,
  currentUserId,
  isAdmin,
}: ColumnOptions) {
  return [
    // 1. Colonne Tâche (Titre & Description)
    columnHelper.accessor("title", {
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-7 -ml-2 text-xs">
          Tâche <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const task = row.original;
        const canEdit = canUserEditTask(task, currentUserId, isAdmin);
        return (
          <div className="min-w-[160px] max-w-[220px]">
            <EditableTextCell
              value={task.title}
              canEdit={canEdit}
              onSave={(val) => onUpdate(task.id, { title: val })}
              className="font-semibold text-xs"
            />
            {task.description && (
              <p className="text-[10px] text-muted-foreground truncate px-1.5">{task.description}</p>
            )}
          </div>
        );
      },
    }),

    // 2. Colonne Pilote
    columnHelper.display({
      id: "pilote",
      header: "Pilote",
      cell: ({ row }) => {
        const task = row.original;
        const assignees = task.assignments?.map((a) => a.user.name).join(", ");
        if (assignees) {
          return <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-medium text-[11px]">👤 {assignees}</span>;
        }
        if (task.createdBy) {
          return <span className="text-muted-foreground italic text-[10px]">Créé par {task.createdBy.name}</span>;
        }
        return <span className="text-muted-foreground italic text-[10px]">Non assigné</span>;
      },
    }),

    // 3. Colonne Échéance
    columnHelper.accessor("dueDate", {
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-7 -ml-2 text-xs">
          Échéance <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const task = row.original;
        const canEdit = canUserEditTask(task, currentUserId, isAdmin);
        const overdue = isTaskOverdue(task);
        const dateVal = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "";

        if (!canEdit) {
          return (
            <span className={cn("text-xs font-mono", overdue ? "text-destructive font-bold" : "text-muted-foreground")}>
              {dateVal || "—"}
            </span>
          );
        }

        return (
          <input
            type="date"
            value={dateVal}
            onChange={(e) => onUpdate(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className={cn("h-7 text-xs border rounded px-1.5 bg-background font-mono", overdue && "border-destructive text-destructive")}
          />
        );
      },
    }),

    // 4. Colonne Charge
    columnHelper.accessor("workload", {
      header: "Charge",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <EditableTextCell
            value={task.workload}
            placeholder="ex: 4h"
            canEdit={canUserEditTask(task, currentUserId, isAdmin)}
            onSave={(val) => onUpdate(task.id, { workload: val })}
            className="w-16 font-mono text-center"
          />
        );
      },
    }),

    // 5. Colonne Livrables
    columnHelper.accessor("deliverables", {
      header: "Livrables",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <EditableTextCell
            value={task.deliverables}
            placeholder="Livrables..."
            canEdit={canUserEditTask(task, currentUserId, isAdmin)}
            onSave={(val) => onUpdate(task.id, { deliverables: val })}
            className="w-28 truncate"
          />
        );
      },
    }),

    // 6. Colonne Priorité
    columnHelper.accessor("priority", {
      header: "Priorité",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <EditablePriorityCell
            priority={task.priority}
            canEdit={canUserEditTask(task, currentUserId, isAdmin)}
            onSave={(priority) => onUpdate(task.id, { priority })}
          />
        );
      },
    }),

    // 7. Colonne Qui valide ? Comment ?
    columnHelper.display({
      id: "validation",
      header: "Qui valide ? Comment ?",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <EditableTextCell
            value={task.validationCriteria || task.validator}
            placeholder="Critères..."
            canEdit={canUserEditTask(task, currentUserId, isAdmin)}
            onSave={(val) => onUpdate(task.id, { validationCriteria: val })}
            className="w-28 truncate"
          />
        );
      },
    }),

    // 8. Colonne % Avancement & Statut
    columnHelper.accessor("progress", {
      header: "% Avancement",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <EditableProgressCell
            task={task}
            canEdit={canUserEditTask(task, currentUserId, isAdmin)}
            onUpdate={onUpdate}
          />
        );
      },
    }),

    // 9. Colonne Dernière MAJ
    columnHelper.display({
      id: "lastUpdate",
      header: "Dernière MAJ",
      cell: ({ row }) => {
        const date = row.original.updatedAt;
        return (
          <span className="text-muted-foreground text-[11px] font-mono">
            {date ? new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}
          </span>
        );
      },
    }),

    // 10. Colonne Retard ? Cause ? & Actions
    columnHelper.display({
      id: "delayReason",
      header: "Retard ? Cause ?",
      cell: ({ row }) => {
        const task = row.original;
        const canEdit = canUserEditTask(task, currentUserId, isAdmin);
        const canDelete = isAdmin || task.createdById === currentUserId;
        const overdue = isTaskOverdue(task);

        return (
          <div className="flex items-center justify-between gap-1.5 min-w-[140px]">
            <EditableDelayCell task={task} isOverdue={overdue} canEdit={canEdit} onUpdate={onUpdate} />
            {canDelete && onDelete && (
              <TaskTableDeleteDialog taskId={task.id} taskTitle={task.title} onDelete={onDelete} />
            )}
          </div>
        );
      },
    }),
  ];
}
