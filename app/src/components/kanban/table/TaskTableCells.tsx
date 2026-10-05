"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { computeSyncStatusAndProgress } from "@/lib/m2v5/m2v5Logic";
import type { KanbanTask } from "../KanbanBoard";

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

interface EditableTextCellProps {
  value: string | null | undefined;
  placeholder?: string;
  canEdit: boolean;
  onSave: (val: string) => void;
  className?: string;
}

/**
 * Cellule texte avec sauvegarde automatique au onBlur ou touche Entrée.
 */
export function EditableTextCell({
  value,
  placeholder = "—",
  canEdit,
  onSave,
  className,
}: EditableTextCellProps) {
  const [currentVal, setCurrentVal] = useState(value || "");

  useEffect(() => {
    setCurrentVal(value || "");
  }, [value]);

  if (!canEdit) {
    return <span className={cn("text-muted-foreground truncate block", className)}>{value || placeholder}</span>;
  }

  return (
    <input
      type="text"
      value={currentVal}
      placeholder={placeholder}
      onChange={(e) => setCurrentVal(e.target.value)}
      onBlur={() => {
        if (currentVal !== (value || "")) {
          onSave(currentVal);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className={cn("h-7 w-full text-xs bg-transparent border-transparent hover:border-input focus:border-primary focus:bg-background rounded px-1.5 transition-colors border", className)}
    />
  );
}

interface EditablePriorityCellProps {
  priority: KanbanTask["priority"];
  canEdit: boolean;
  onSave: (priority: KanbanTask["priority"]) => void;
}

/**
 * Cellule Priorité avec sélection directe et badge coloré.
 */
export function EditablePriorityCell({ priority, canEdit, onSave }: EditablePriorityCellProps) {
  if (!canEdit) {
    return (
      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", PRIORITY_STYLES[priority])}>
        {PRIORITY_LABELS[priority] || priority}
      </Badge>
    );
  }

  return (
    <select
      value={priority}
      onChange={(e) => onSave(e.target.value as KanbanTask["priority"])}
      className={cn("h-7 text-[10px] font-medium border rounded px-1.5 bg-background cursor-pointer", PRIORITY_STYLES[priority])}
    >
      <option value="LOW">Basse</option>
      <option value="NORMAL">Normale</option>
      <option value="HIGH">Haute</option>
      <option value="CRITICAL">Critique</option>
    </select>
  );
}

interface EditableProgressCellProps {
  task: KanbanTask;
  canEdit: boolean;
  onUpdate: (taskId: string, data: Partial<KanbanTask>) => void;
}

/**
 * Cellule combinée Avancement (%) & Statut avec couplage bidirectionnel intelligent.
 */
export function EditableProgressCell({ task, canEdit, onUpdate }: EditableProgressCellProps) {
  const progress = task.progress ?? (task.status === "DONE" ? 100 : 0);

  const handleProgressChange = (newProgress: number) => {
    const clamped = Math.max(0, Math.min(100, newProgress));
    const nextState = computeSyncStatusAndProgress(
      { status: task.status, progress },
      { progress: clamped }
    );
    onUpdate(task.id, { progress: nextState.progress, status: nextState.status });
  };

  const handleStatusChange = (newStatus: KanbanTask["status"]) => {
    const nextState = computeSyncStatusAndProgress(
      { status: task.status, progress },
      { status: newStatus }
    );
    onUpdate(task.id, { status: nextState.status, progress: nextState.progress });
  };

  return (
    <div className="flex items-center gap-1.5">
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
        <span className="font-mono text-xs font-semibold w-9 text-right">{progress}%</span>
      )}

      {/* Barre de progression visuelle */}
      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
        <div
          className={cn("h-full transition-all", progress === 100 ? "bg-green-500" : "bg-primary")}
          style={{ width: `${progress}%` }}
        />
      </div>

      {canEdit ? (
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value as KanbanTask["status"])}
          className="h-6 text-[10px] border rounded bg-background px-1"
        >
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {STATUS_LABELS[task.status]}
        </span>
      )}
    </div>
  );
}

interface EditableDelayCellProps {
  task: KanbanTask;
  isOverdue: boolean;
  canEdit: boolean;
  onUpdate: (taskId: string, data: Partial<KanbanTask>) => void;
}

/**
 * Cellule Retard & Cause avec alerte dynamique.
 */
export function EditableDelayCell({ task, isOverdue, canEdit, onUpdate }: EditableDelayCellProps) {
  return (
    <div className="flex items-center gap-1.5">
      {isOverdue && (
        <Badge variant="destructive" className="gap-1 text-[9px] px-1 py-0 animate-pulse shrink-0">
          <AlertCircle className="h-3 w-3" /> RETARD
        </Badge>
      )}
      <EditableTextCell
        value={task.delayReason}
        placeholder={isOverdue ? "Préciser la cause..." : "Cause..."}
        canEdit={canEdit}
        onSave={(val) => onUpdate(task.id, { delayReason: val })}
        className="w-28"
      />
    </div>
  );
}
