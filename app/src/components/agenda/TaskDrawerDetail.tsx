"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AgendaTask, TaskStatusType } from "./agendaTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileCheck,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDrawerDetailProps {
  task: AgendaTask;
  onStatusChange: (taskId: string, newStatus: TaskStatusType) => Promise<void>;
}

const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  LOW: { label: "Priorité Basse", className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  NORMAL: { label: "Priorité Normale", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  HIGH: { label: "Priorité Haute", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  CRITICAL: { label: "Priorité Critique", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export function TaskDrawerDetail({ task, onStatusChange }: TaskDrawerDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuickStatus = async (newStatus: TaskStatusType) => {
    if (newStatus === task.status || isUpdating) return;
    setIsUpdating(true);
    try {
      await onStatusChange(task.originalId, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.NORMAL;
  const dueDateFormatted = task.dueDate
    ? format(new Date(task.dueDate), "EEEE d MMMM yyyy", { locale: fr })
    : "Aucune date limite";

  return (
    <div className="flex flex-col gap-6 p-5">
      {/* En-tête de la fiche tâche */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-semibold", priorityInfo.className)}>
            {priorityInfo.label}
          </Badge>
          {task.isMine ? (
            <Badge className="bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/40">
              Ma tâche
            </Badge>
          ) : (
            <Badge className="bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 border-indigo-500/40">
              Tâche équipe
            </Badge>
          )}
        </div>
        {task.isOverdue && (
          <span className="flex items-center gap-1 text-xs font-semibold text-rose-500 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" /> En retard
          </span>
        )}
      </div>

      {/* Titre & Description */}
      <div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">{task.title}</h3>
        {task.description ? (
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{task.description}</p>
        ) : (
          <p className="mt-2 text-xs italic text-muted-foreground">Aucune description renseignée</p>
        )}
      </div>

      {/* Actions rapides de changement de statut */}
      <div className="rounded-lg border bg-muted/30 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Statut actuel & Action rapide
          </span>
          {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={task.status === "TODO" ? "default" : "outline"}
            className={cn("text-xs font-medium", task.status === "TODO" && "bg-slate-700 text-white")}
            disabled={isUpdating}
            onClick={() => handleQuickStatus("TODO")}
          >
            À faire
          </Button>
          <Button
            size="sm"
            variant={task.status === "IN_PROGRESS" ? "default" : "outline"}
            className={cn("text-xs font-medium", task.status === "IN_PROGRESS" && "bg-blue-600 text-white")}
            disabled={isUpdating}
            onClick={() => handleQuickStatus("IN_PROGRESS")}
          >
            En cours
          </Button>
          <Button
            size="sm"
            variant={task.status === "DONE" ? "default" : "outline"}
            className={cn("text-xs font-medium", task.status === "DONE" && "bg-emerald-600 text-white")}
            disabled={isUpdating}
            onClick={() => handleQuickStatus("DONE")}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Terminé
          </Button>
        </div>
      </div>

      {/* Jauge d'avancement */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-muted-foreground">Avancement global</span>
          <span className="font-bold text-foreground">{task.progress}%</span>
        </div>
        <Progress value={task.progress} className="h-2" />
      </div>

      {/* Assignations & Dates */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border bg-card p-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
          <span>Échéance :</span>
          <strong className={cn("text-foreground", task.isOverdue && "text-rose-500")}>
            {dueDateFormatted}
          </strong>
        </div>

        <div className="flex items-start gap-2 text-muted-foreground">
          <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>Assigné(s) :</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {task.assignments && task.assignments.length > 0 ? (
                task.assignments.map(({ user }) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {user.name}
                  </span>
                ))
              ) : (
                <span className="italic text-muted-foreground">Non assignée</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Métadonnées Méthodologiques IMT */}
      {(task.workload || task.deliverables || task.validationCriteria || task.delayReason) && (
        <div className="space-y-3 rounded-lg border border-border/80 bg-muted/15 p-4 text-xs">
          <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
            Métadonnées IMT & Suivi
          </h4>
          {task.workload && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Charge estimée :</span>
              <span className="font-semibold">{task.workload}</span>
            </div>
          )}
          {task.deliverables && (
            <div className="flex items-start gap-2">
              <FileCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Livrable(s) attendu(s) :</span>
                <p className="mt-0.5 font-medium">{task.deliverables}</p>
              </div>
            </div>
          )}
          {task.validationCriteria && (
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Validation :</span>
                <p className="mt-0.5 font-medium">{task.validationCriteria}</p>
              </div>
            </div>
          )}
          {task.delayReason && (
            <div className="rounded border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400">
              <strong>Cause du retard :</strong> {task.delayReason}
            </div>
          )}
        </div>
      )}

      {/* Raccourci vers Kanban */}
      <Button
        variant="outline"
        className="w-full gap-2 text-xs"
        onClick={() => router.push("/kanban")}
      >
        <ExternalLink className="h-4 w-4" /> Ouvrir dans le Kanban pour modification complète
      </Button>
    </div>
  );
}
