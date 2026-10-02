"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Trash2 } from "lucide-react";
import type { KanbanTask } from "./KanbanBoard";

interface TaskTableRowProps {
  task: KanbanTask;
  onUpdate: (taskId: string, data: Partial<KanbanTask>) => Promise<void>;
  onDelete?: (taskId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  NORMAL: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-500 border-red-500/20",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  BLOCKED: "Bloquée",
};

/**
 * Ligne individuelle représentant une tâche dans la vue tabulaire exhaustive.
 */
export function TaskTableRow({ task, onUpdate, onDelete, canEdit, canDelete }: TaskTableRowProps) {
  const [isEditingDelay, setIsEditingDelay] = useState(false);
  const [delayText, setDelayText] = useState(task.delayReason || "");

  const progress = task.progress ?? (task.status === "DONE" ? 100 : 0);
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE" &&
    progress < 100;

  const handleProgressChange = async (newVal: number) => {
    const clamped = Math.max(0, Math.min(100, newVal));
    await onUpdate(task.id, { progress: clamped });
  };

  const handleStatusChange = async (newStatus: string) => {
    await onUpdate(task.id, { status: newStatus as KanbanTask["status"] });
  };

  const handleSaveDelay = async () => {
    await onUpdate(task.id, { delayReason: delayText.trim() });
    setIsEditingDelay(false);
  };

  const assignees = task.assignments?.map((a) => a.user.name).join(", ");

  return (
    <tr className={cn("border-b hover:bg-muted/40 transition-colors text-xs", isOverdue && "bg-red-500/5")}>
      {/* 1. Tâche */}
      <td className="p-2.5 font-medium max-w-[200px] truncate" title={task.title}>
        <div className="font-semibold text-foreground">{task.title}</div>
        {task.description && (
          <div className="text-[11px] text-muted-foreground truncate">{task.description}</div>
        )}
      </td>

      {/* 2. Pilote */}
      <td className="p-2.5 whitespace-nowrap">
        {assignees ? (
          <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-medium">
            👤 {assignees}
          </span>
        ) : task.createdBy ? (
          <span className="text-muted-foreground italic text-[11px]">Créé par {task.createdBy.name}</span>
        ) : (
          <span className="text-muted-foreground italic text-[11px]">Non assigné</span>
        )}
      </td>

      {/* 3. Échéance */}
      <td className="p-2.5 whitespace-nowrap">
        {task.dueDate ? (
          <span className={cn("font-medium", isOverdue ? "text-red-500 font-bold" : "text-muted-foreground")}>
            {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
          </span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </td>

      {/* 4. Charge de travail */}
      <td className="p-2.5 whitespace-nowrap text-muted-foreground font-mono">
        {task.workload || "—"}
      </td>

      {/* 5. Livrables */}
      <td className="p-2.5 max-w-[150px] truncate text-muted-foreground" title={task.deliverables || ""}>
        {task.deliverables || "—"}
      </td>

      {/* 6. Priorité */}
      <td className="p-2.5 whitespace-nowrap">
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", PRIORITY_STYLES[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      </td>

      {/* 7. Qui valide ? Comment ? */}
      <td className="p-2.5 max-w-[150px] truncate text-muted-foreground" title={task.validationCriteria || ""}>
        {task.validationCriteria || "—"}
      </td>

      {/* 8. % d'avancement & statut */}
      <td className="p-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {canEdit ? (
            <input
              type="number"
              min="0"
              max="100"
              step="10"
              value={progress}
              onChange={(e) => handleProgressChange(parseInt(e.target.value) || 0)}
              className="w-12 h-6 text-center border rounded font-mono text-xs bg-background"
            />
          ) : (
            <span className="font-mono font-semibold">{progress}%</span>
          )}
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", progress === 100 ? "bg-green-500" : "bg-primary")}
              style={{ width: `${progress}%` }}
            />
          </div>
          {canEdit ? (
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-6 text-[10px] border rounded bg-background px-1"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          ) : (
            <span className="text-[10px] text-muted-foreground">{STATUS_LABELS[task.status]}</span>
          )}
        </div>
      </td>

      {/* 9. Mise à jour le... */}
      <td className="p-2.5 whitespace-nowrap text-muted-foreground text-[11px]">
        {task.updatedAt
          ? new Date(task.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
          : "—"}
      </td>

      {/* 10. Retard ? Cause ? + Actions */}
      <td className="p-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            {isOverdue && (
              <Badge variant="destructive" className="gap-1 text-[9px] px-1 py-0 animate-pulse">
                <AlertCircle className="h-3 w-3" /> RETARD
              </Badge>
            )}
            {isEditingDelay ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={delayText}
                  onChange={(e) => setDelayText(e.target.value)}
                  placeholder="Cause..."
                  className="h-6 w-24 text-[11px] border rounded px-1"
                />
                <button type="button" onClick={handleSaveDelay} className="text-xs text-primary font-bold">✓</button>
              </div>
            ) : (
              <span
                onClick={() => canEdit && setIsEditingDelay(true)}
                className={cn("truncate max-w-[120px] text-[11px]", canEdit && "cursor-pointer hover:underline text-muted-foreground")}
                title={task.delayReason || (canEdit ? "Cliquer pour ajouter une cause" : "")}
              >
                {task.delayReason || (isOverdue && canEdit ? "Préciser cause..." : "—")}
              </span>
            )}
          </div>
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="text-muted-foreground hover:text-destructive p-1 rounded"
              title="Supprimer la tâche"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
