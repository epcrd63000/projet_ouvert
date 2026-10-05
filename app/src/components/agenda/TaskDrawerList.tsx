"use client";

import React, { useState, useMemo } from "react";
import { AgendaTask } from "./agendaTypes";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { cn } from "@/lib/utils";

interface TaskDrawerListProps {
  tasks: AgendaTask[];
  activeTab: "mine" | "all";
  onTabChange: (tab: "mine" | "all") => void;
  onSelectTask: (taskId: string) => void;
}

const STATUS_ICONS: Record<string, { label: string; color: string }> = {
  TODO: { label: "À faire", color: "text-slate-400" },
  IN_PROGRESS: { label: "En cours", color: "text-blue-400" },
  DONE: { label: "Terminée", color: "text-emerald-400" },
  BLOCKED: { label: "Bloquée", color: "text-rose-400" },
};

export function TaskDrawerList({
  tasks,
  activeTab,
  onTabChange,
  onSelectTask,
}: TaskDrawerListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Séparation personnelle vs équipe
  const myTasksCount = useMemo(() => tasks.filter((t) => t.isMine).length, [tasks]);
  const allTasksCount = tasks.length;

  // Filtrage selon onglet et recherche textuelle
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeTab === "mine" && !task.isMine) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(term);
      const matchAssignees = task.assignments?.some((a) =>
        a.user.name.toLowerCase().includes(term)
      );
      return matchTitle || matchAssignees;
    });
  }, [tasks, activeTab, searchTerm]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Onglets Mes tâches / Toutes les tâches */}
      <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => onTabChange("mine")}
          className={cn(
            "rounded-md py-1.5 transition-all text-center",
            activeTab === "mine"
              ? "bg-background text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Mes tâches ({myTasksCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange("all")}
          className={cn(
            "rounded-md py-1.5 transition-all text-center",
            activeTab === "all"
              ? "bg-background text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Toutes les tâches ({allTasksCount})
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher une tâche ou un membre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 text-xs h-9"
        />
      </div>

      {/* Liste des cartes cliquables */}
      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Aucune tâche trouvée
          </div>
        ) : (
          filteredTasks.map((task) => {
            const statusConfig = STATUS_ICONS[task.status] || STATUS_ICONS.TODO;
            const formattedDate = task.dueDate
              ? format(new Date(task.dueDate), "d MMM", { locale: fr })
              : null;

            return (
              <div
                key={task.originalId}
                onClick={() => onSelectTask(task.originalId)}
                className={cn(
                  "group cursor-pointer rounded-lg border bg-card p-3.5 transition-all hover:border-primary/50 hover:shadow-sm",
                  task.isOverdue && "border-rose-500/40 bg-rose-500/[0.02]",
                  task.isMine ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-indigo-500"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                    {task.title}
                  </h4>
                  {task.isOverdue ? (
                    <span className="shrink-0 text-rose-500" title="Tâche en retard">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                  ) : task.status === "DONE" ? (
                    <span className="shrink-0 text-emerald-500" title="Terminée">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("font-medium flex items-center gap-1", statusConfig.color)}>
                    <Clock className="h-3 w-3" /> {statusConfig.label}
                  </span>

                  {formattedDate && (
                    <span className={cn("inline-flex items-center gap-1", task.isOverdue && "text-rose-500 font-semibold")}>
                      <Calendar className="h-3 w-3" /> {formattedDate}
                    </span>
                  )}

                  {task.isMine ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-500 dark:text-amber-300 border-amber-500/30">
                      Perso
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 border-indigo-500/30">
                      Équipe
                    </Badge>
                  )}
                </div>

                {task.assignments && task.assignments.length > 0 && (
                  <div className="mt-2 text-[11px] text-muted-foreground line-clamp-1">
                    Pilote(s) : {task.assignments.map((a) => a.user.name).join(", ")}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
