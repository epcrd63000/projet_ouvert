"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { TaskTableToolbar } from "./table/TaskTableToolbar";
import { TaskTableQuickAddRow } from "./table/TaskTableQuickAddRow";
import { createTaskColumns } from "./table/TaskTableColumns";
import { isTaskOverdue } from "@/lib/m2v5/m2v5Logic";
import type { KanbanTask } from "./KanbanBoard";
import type { UserSummary } from "@/hooks/useTasks";
import type { TaskFormData } from "./TaskModal";

interface TaskTableViewProps {
  tasks: KanbanTask[];
  users?: UserSummary[];
  onUpdate: (taskId: string, data: Partial<KanbanTask>) => Promise<void>;
  onCreate?: (data: TaskFormData) => Promise<void>;
  onDelete?: (taskId: string) => void;
  currentUserId: string;
  isAdmin: boolean;
}

/**
 * Vue principale du tableau de bord exhaustif M2V5.
 * Entièrement interactif au format tableur avec auto-save et filtres avancés.
 */
export function TaskTableView({
  tasks,
  users = [],
  onUpdate,
  onCreate,
  onDelete,
  currentUserId,
  isAdmin,
}: TaskTableViewProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [pilotFilter, setPilotFilter] = useState<string>("ALL");
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Décompte des tâches en retard
  const lateTasksCount = useMemo(() => {
    return tasks.filter((t) => isTaskOverdue(t)).length;
  }, [tasks]);

  // Filtrage combiné (Statut, Priorité, Pilote, Retard)
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
      if (pilotFilter !== "ALL") {
        const hasUser = task.assignments?.some((a) => a.user.id === pilotFilter);
        if (!hasUser) return false;
      }
      if (overdueOnly && !isTaskOverdue(task)) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, pilotFilter, overdueOnly]);

  const columns = useMemo(
    () => createTaskColumns({ onUpdate, onDelete, users, currentUserId, isAdmin }),
    [onUpdate, onDelete, users, currentUserId, isAdmin]
  );

  const table = useReactTable({
    data: filteredTasks,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      {/* Barre d'outils et de filtres enrichie */}
      <TaskTableToolbar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        pilotFilter={pilotFilter}
        setPilotFilter={setPilotFilter}
        overdueOnly={overdueOnly}
        setOverdueOnly={setOverdueOnly}
        lateTasksCount={lateTasksCount}
        filteredTasks={filteredTasks}
        users={users}
      />

      {/* Grille de données tableur */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-muted/80 text-muted-foreground sticky top-0 z-10 border-b backdrop-blur">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-2.5 font-semibold text-foreground/80">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    Aucune tâche correspondante aux filtres actuels.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/40 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-2 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Ligne d'insertion rapide inline au bas du tableau */}
        <TaskTableQuickAddRow
          users={users}
          currentUserId={currentUserId}
          onCreate={onCreate}
        />
      </div>
    </div>
  );
}
