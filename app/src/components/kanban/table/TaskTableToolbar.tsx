"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { exportTasksToCsv } from "@/lib/csvExport";
import { generateM2V5ClipboardTsv } from "@/lib/m2v5/m2v5Logic";
import type { KanbanTask } from "../KanbanBoard";
import type { UserSummary } from "@/hooks/useTasks";

interface TaskTableToolbarProps {
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  pilotFilter: string;
  setPilotFilter: (val: string) => void;
  overdueOnly: boolean;
  setOverdueOnly: (val: boolean) => void;
  lateTasksCount: number;
  filteredTasks: KanbanTask[];
  users: UserSummary[];
}

/**
 * Barre d'outils et de filtrage enrichie pour le tableau opérationnel M2V5.
 */
export function TaskTableToolbar({
  globalFilter,
  setGlobalFilter,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  pilotFilter,
  setPilotFilter,
  overdueOnly,
  setOverdueOnly,
  lateTasksCount,
  filteredTasks,
  users,
}: TaskTableToolbarProps) {
  const handleCopyClipboard = async () => {
    try {
      const tsv = generateM2V5ClipboardTsv(filteredTasks);
      await navigator.clipboard.writeText(tsv);
      toast.success("Tableau copié ! Vous pouvez le coller dans Excel, Word ou Teams.");
    } catch {
      toast.error("Impossible de copier dans le presse-papier");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        {/* Recherche textuelle */}
        <div className="relative flex-1 min-w-[170px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        {/* Filtres de sélection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 text-xs border rounded-md px-2 bg-background"
            aria-label="Filtrer par statut"
          >
            <option value="ALL">Tous statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="DONE">Terminée</option>
            <option value="BLOCKED">Bloquée</option>
          </select>

          {/* Filtre Priorité */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 text-xs border rounded-md px-2 bg-background"
            aria-label="Filtrer par priorité"
          >
            <option value="ALL">Toutes priorités</option>
            <option value="LOW">Basse</option>
            <option value="NORMAL">Normale</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>

          {/* Filtre Pilote */}
          {users.length > 0 && (
            <select
              value={pilotFilter}
              onChange={(e) => setPilotFilter(e.target.value)}
              className="h-9 text-xs border rounded-md px-2 bg-background max-w-[130px]"
              aria-label="Filtrer par pilote"
            >
              <option value="ALL">Tous les pilotes</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}

          {/* Bouton bascule Tâches en retard */}
          <Button
            type="button"
            variant={overdueOnly ? "destructive" : "outline"}
            size="sm"
            onClick={() => setOverdueOnly(!overdueOnly)}
            className="h-9 text-xs gap-1.5"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            En retard
            {lateTasksCount > 0 && (
              <Badge
                variant={overdueOnly ? "secondary" : "destructive"}
                className="ml-0.5 px-1.5 py-0 text-[10px]"
              >
                {lateTasksCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Actions d'export et compteur */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filteredTasks.length} tâche(s)
        </span>

        {/* Bouton Copier Presse-papier */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyClipboard}
          className="gap-1.5 text-xs h-9"
          title="Copier le tableau pour coller dans Excel ou Teams"
        >
          <Copy className="h-3.5 w-3.5" /> Copier
        </Button>

        {/* Bouton Export CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportTasksToCsv(filteredTasks)}
          className="gap-1.5 text-xs h-9"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>
    </div>
  );
}
