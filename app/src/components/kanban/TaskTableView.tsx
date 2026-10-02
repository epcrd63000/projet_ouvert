"use client";

import React, { useState, useMemo } from "react";
import { TaskTableRow } from "./TaskTableRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Filter } from "lucide-react";
import { exportTasksToCsv } from "@/lib/csvExport";
import type { KanbanTask } from "./KanbanBoard";

interface TaskTableViewProps {
  tasks: KanbanTask[];
  onUpdate: (taskId: string, data: Partial<KanbanTask>) => Promise<void>;
  onDelete?: (taskId: string) => void;
  currentUserId: string;
  isAdmin: boolean;
}

/**
 * Vue tabulaire exhaustive (M2V5) de la liste des tâches avec filtres et export CSV.
 */
export function TaskTableView({
  tasks,
  onUpdate,
  onDelete,
  currentUserId,
  isAdmin,
}: TaskTableViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Filtrage combiné (recherche textuelle, statut, priorité)
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignments?.some((a) =>
          a.user.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const handleExportCsv = () => {
    exportTasksToCsv(filteredTasks);
  };

  return (
    <div className="space-y-4">
      {/* Barre d'outils et de filtrage */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une tâche, pilote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 text-xs border rounded-md px-2 bg-background"
            >
              <option value="ALL">Tous statuts</option>
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="DONE">Terminée</option>
              <option value="BLOCKED">Bloquée</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 text-xs border rounded-md px-2 bg-background"
            >
              <option value="ALL">Toutes priorités</option>
              <option value="LOW">Basse</option>
              <option value="NORMAL">Normale</option>
              <option value="HIGH">Haute</option>
              <option value="CRITICAL">Critique</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filteredTasks.length} tâche{filteredTasks.length > 1 ? "s" : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 text-xs h-9"
          >
            <Download className="h-3.5 w-3.5" /> Exporter CSV (Excel)
          </Button>
        </div>
      </div>

      {/* Tableau exhaustif 10 colonnes M2V5 */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-muted/80 text-muted-foreground sticky top-0 z-10 border-b backdrop-blur">
              <tr>
                <th className="p-2.5 font-semibold">Tâche</th>
                <th className="p-2.5 font-semibold">Pilote</th>
                <th className="p-2.5 font-semibold">Échéance</th>
                <th className="p-2.5 font-semibold">Charge</th>
                <th className="p-2.5 font-semibold">Livrables</th>
                <th className="p-2.5 font-semibold">Priorité</th>
                <th className="p-2.5 font-semibold">Qui valide ? Comment ?</th>
                <th className="p-2.5 font-semibold">% Avancement</th>
                <th className="p-2.5 font-semibold">Dernière MAJ</th>
                <th className="p-2.5 font-semibold">Retard ? Cause ?</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    Aucune tâche ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isAssigned = task.assignments?.some(
                    (a) => a.user.id === currentUserId
                  );
                  const isCreator = task.createdById === currentUserId;
                  const canEdit = isAdmin || isAssigned || isCreator;
                  const canDelete = isAdmin || isCreator;

                  return (
                    <TaskTableRow
                      key={task.id}
                      task={task}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
