"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2, AlertCircle, Calendar, Users, Percent, ShieldCheck } from "lucide-react";
import { computeSyncStatusAndProgress } from "@/lib/m2v5/m2v5Logic";
import { canUserEditTask } from "@/lib/tasks/taskScopeLogic";
import type { KanbanTask } from "./KanbanBoard";
import type { UserSummary } from "@/hooks/useTasks";

interface TaskDetailFormProps {
  task: KanbanTask;
  users: UserSummary[];
  currentUserId: string;
  isAdmin: boolean;
  onSave: (taskId: string, payload: any) => Promise<void>; // eslint-disable-line
  onDelete?: (taskId: string) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS = [
  { id: "TODO", label: "À faire", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  { id: "IN_PROGRESS", label: "En cours", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
  { id: "DONE", label: "Terminée", color: "bg-green-500/10 text-green-500 border-green-500/30" },
  { id: "BLOCKED", label: "Bloquée", color: "bg-red-500/10 text-red-500 border-red-500/30" },
] as const;

const PRIORITY_OPTIONS = [
  { id: "LOW", label: "Basse" },
  { id: "NORMAL", label: "Normale" },
  { id: "HIGH", label: "Haute" },
  { id: "CRITICAL", label: "Critique" },
] as const;

/**
 * Formulaire de modification complète d'une tâche sélectionnée.
 * Applique strictement le contrôle d'accès (propriétaire, binôme ou administrateur).
 */
export function TaskDetailForm({
  task,
  users,
  currentUserId,
  isAdmin,
  onSave,
  onDelete,
  onCancel,
}: TaskDetailFormProps) {
  const canEdit = canUserEditTask(task, currentUserId, isAdmin);
  const isAssigned = Boolean(currentUserId && task.assignments?.some((a) => a.user.id === currentUserId));
  const canDelete = Boolean(isAdmin || (currentUserId && task.createdById === currentUserId) || isAssigned);

  const myInitialAssignment = task.assignments?.find((a) => a.user.id === currentUserId);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<KanbanTask["status"]>(myInitialAssignment?.status || task.status);
  const [priority, setPriority] = useState<KanbanTask["priority"]>(task.priority);
  const [progress, setProgress] = useState<number>(task.progress ?? (task.status === "DONE" ? 100 : 0));
  const [dueDate, setDueDate] = useState<string>(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  );
  const [workload, setWorkload] = useState(task.workload || "");
  const [deliverables, setDeliverables] = useState(task.deliverables || "");
  const [validationCriteria, setValidationCriteria] = useState(task.validationCriteria || task.validator || "");
  const [delayReason, setDelayReason] = useState(task.delayReason || "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task.assignments ? task.assignments.map((a) => a.user.id) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    const myAssignment = task.assignments?.find((a) => a.user.id === currentUserId);
    setStatus(myAssignment?.status || task.status);
    setPriority(task.priority);
    setProgress(task.progress ?? (task.status === "DONE" ? 100 : 0));
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    setWorkload(task.workload || "");
    setDeliverables(task.deliverables || "");
    setValidationCriteria(task.validationCriteria || task.validator || "");
    setDelayReason(task.delayReason || "");
    setAssigneeIds(task.assignments ? task.assignments.map((a) => a.user.id) : []);
  }, [task, currentUserId]);

  const handleStatusChange = (newStatus: KanbanTask["status"]) => {
    if (!canEdit) return;
    const sync = computeSyncStatusAndProgress({ status, progress }, { status: newStatus });
    setStatus(sync.status);
    setProgress(sync.progress);
  };

  const handleProgressChange = (newProgress: number) => {
    if (!canEdit) return;
    const bounded = Math.max(0, Math.min(100, newProgress));
    const sync = computeSyncStatusAndProgress({ status, progress }, { progress: bounded });
    setStatus(sync.status);
    setProgress(sync.progress);
  };

  const toggleAssignee = (userId: string) => {
    if (!canEdit) return;
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        progress,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        workload: workload.trim() || null,
        deliverables: deliverables.trim() || null,
        validationCriteria: validationCriteria.trim() || null,
        delayReason: delayReason.trim() || null,
        assigneeIds,
      });
      onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 pr-2">
      {!canEdit && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Mode consultation seule : Vous ne pouvez modifier que les tâches qui vous sont assignées
            ou celles que vous partagez en binôme.
          </span>
        </div>
      )}

      {/* Titre */}
      <div className="space-y-1">
        <Label htmlFor="task-title" className="text-xs font-semibold">Titre de la tâche *</Label>
        <Input
          id="task-title"
          value={title}
          disabled={!canEdit}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Réalisation des couples..."
          required
        />
      </div>

      {/* Statut & Avancement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Statut</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.id}
                type="button"
                variant={status === opt.id ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
                onClick={() => handleStatusChange(opt.id)}
                className="h-8 text-xs justify-center"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="task-progress" className="text-xs font-semibold flex items-center gap-1">
              <Percent className="h-3 w-3" /> Avancement
            </Label>
            <span className="text-xs font-mono font-bold text-primary">{progress}%</span>
          </div>
          <input
            id="task-progress"
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            disabled={!canEdit}
            onChange={(e) => handleProgressChange(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-muted rounded cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Priorité & Échéance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Priorité</Label>
          <div className="flex flex-wrap gap-1">
            {PRIORITY_OPTIONS.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant={priority === p.id ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
                onClick={() => setPriority(p.id)}
                className="h-7 text-xs px-2"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-due" className="text-xs font-semibold flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Date d&apos;échéance
          </Label>
          <Input
            id="task-due"
            type="date"
            value={dueDate}
            disabled={!canEdit}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      {/* Assignation des membres */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Assignés (travail en binôme / équipe)
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {assigneeIds.length} membre{assigneeIds.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {users.map((u) => {
            const isAssigned = assigneeIds.includes(u.id);
            const isMe = u.id === currentUserId;
            return (
              <Button
                key={u.id}
                type="button"
                variant={isAssigned ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
                onClick={() => toggleAssignee(u.id)}
                className="h-7 text-xs gap-1 px-2"
              >
                {isAssigned && <Check className="h-3 w-3" />}
                <span>{u.name}</span>
                {isMe && <span className="text-[10px] opacity-75">(Moi)</span>}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Livrables & Charge de travail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="task-workload" className="text-xs font-semibold">Charge estimée</Label>
          <Input
            id="task-workload"
            value={workload}
            disabled={!canEdit}
            onChange={(e) => setWorkload(e.target.value)}
            placeholder="Ex: 4h, 2 jours..."
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="task-deliverables" className="text-xs font-semibold">Livrables attendus</Label>
          <Input
            id="task-deliverables"
            value={deliverables}
            disabled={!canEdit}
            onChange={(e) => setDeliverables(e.target.value)}
            placeholder="Ex: Fichier DXF, pièce usinée..."
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Validation & Cause du retard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="task-validation" className="text-xs font-semibold">Qui valide ? Comment ?</Label>
          <Input
            id="task-validation"
            value={validationCriteria}
            disabled={!canEdit}
            onChange={(e) => setValidationCriteria(e.target.value)}
            placeholder="Ex: Tuteur, test sur banc..."
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="task-delay" className="text-xs font-semibold">Cause du retard (si applicable)</Label>
          <Input
            id="task-delay"
            value={delayReason}
            disabled={!canEdit}
            onChange={(e) => setDelayReason(e.target.value)}
            placeholder="Ex: Attente livraison matière..."
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Description détaillée */}
      <div className="space-y-1">
        <Label htmlFor="task-desc" className="text-xs font-semibold">Description détaillée</Label>
        <textarea
          id="task-desc"
          value={description}
          disabled={!canEdit}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Consignes précises, liens, spécifications..."
          className="flex w-full rounded-md border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary disabled:opacity-60"
        />
      </div>

      {/* Pied de formulaire avec actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        {canDelete && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="gap-1.5 h-8 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8 text-xs">
            {canEdit ? "Annuler" : "Fermer"}
          </Button>
          {canEdit && (
            <Button type="submit" size="sm" disabled={isSubmitting || !title.trim()} className="gap-1.5 h-8 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isSubmitting ? "Enregistrement..." : "Sauvegarder les modifications"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
