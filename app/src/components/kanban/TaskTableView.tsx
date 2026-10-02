"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Filter, AlertCircle, Trash2, ArrowUpDown } from "lucide-react";
import { exportTasksToCsv } from "@/lib/csvExport";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KanbanTask } from "./KanbanBoard";

interface TaskTableViewProps {
  tasks: KanbanTask[];
  onUpdate: (taskId: string, data: Partial<KanbanTask>) => Promise<void>;
  onDelete?: (taskId: string) => void;
  currentUserId: string;
  isAdmin: boolean;
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

export function TaskTableView({
  tasks,
  onUpdate,
  onDelete,
  currentUserId,
  isAdmin,
}: TaskTableViewProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const columnHelper = createColumnHelper<KanbanTask>();

  const columns = useMemo(() => [
    columnHelper.accessor("title", {
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Tâche <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: (info) => (
        <div className="max-w-[200px] truncate" title={info.getValue()}>
          <div className="font-semibold">{info.getValue()}</div>
          {info.row.original.description && (
            <div className="text-[11px] text-muted-foreground truncate">{info.row.original.description}</div>
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: "pilote",
      header: "Pilote",
      cell: (info) => {
        const task = info.row.original;
        const assignees = task.assignments?.map((a) => a.user.name).join(", ");
        if (assignees) {
          return <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-medium">👤 {assignees}</span>;
        }
        if (task.createdBy) {
          return <span className="text-muted-foreground italic text-[11px]">Créé par {task.createdBy.name}</span>;
        }
        return <span className="text-muted-foreground italic text-[11px]">Non assigné</span>;
      },
    }),
    columnHelper.accessor("dueDate", {
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Échéance <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: (info) => {
        const val = info.getValue();
        const task = info.row.original;
        const progress = task.progress ?? (task.status === "DONE" ? 100 : 0);
        const isOverdue = val && new Date(val) < new Date() && task.status !== "DONE" && progress < 100;
        if (!val) return <span className="text-muted-foreground/60">—</span>;
        return (
          <span className={cn("font-medium", isOverdue ? "text-red-500 font-bold" : "text-muted-foreground")}>
            {new Date(val).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
          </span>
        );
      },
    }),
    columnHelper.accessor("tags", {
      header: "Tags",
      cell: (info) => {
        const tags = info.getValue();
        if (!tags || tags.length === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-[120px]">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-[9px] px-1 py-0">{tag}</Badge>
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor("workload", {
      header: "Charge",
      cell: (info) => <span className="text-muted-foreground font-mono">{info.getValue() || "—"}</span>,
    }),
    columnHelper.accessor("deliverables", {
      header: "Livrables",
      cell: (info) => <div className="max-w-[150px] truncate text-muted-foreground" title={info.getValue() || ""}>{info.getValue() || "—"}</div>,
    }),
    columnHelper.accessor("priority", {
      header: "Priorité",
      cell: (info) => (
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", PRIORITY_STYLES[info.getValue()])}>
          {PRIORITY_LABELS[info.getValue()]}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "validation",
      header: "Qui valide ? Comment ?",
      cell: (info) => {
        const task = info.row.original;
        const val = task.validator || task.validationCriteria;
        return <div className="max-w-[150px] truncate text-muted-foreground" title={val || ""}>{val || "—"}</div>;
      }
    }),
    columnHelper.accessor("progress", {
      header: "% Avancement",
      cell: (info) => {
        const task = info.row.original;
        const isAssigned = task.assignments?.some((a) => a.user.id === currentUserId);
        const isCreator = task.createdById === currentUserId;
        const canEdit = isAdmin || isAssigned || isCreator;
        const progress = info.getValue() ?? (task.status === "DONE" ? 100 : 0);
        
        return (
          <div className="flex items-center gap-2">
            {canEdit ? (
              <input
                type="number"
                min="0"
                max="100"
                step="10"
                value={progress}
                onChange={(e) => onUpdate(task.id, { progress: parseInt(e.target.value) || 0 })}
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
                onChange={(e) => onUpdate(task.id, { status: e.target.value as KanbanTask["status"] })}
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
        );
      },
    }),
    columnHelper.accessor("lastUpdate", {
      header: "Dernière MAJ",
      cell: (info) => {
        const val = info.getValue();
        const displayVal = val || info.row.original.updatedAt;
        return <span className="text-muted-foreground text-[11px]">{displayVal ? new Date(displayVal).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}</span>;
      }
    }),
    columnHelper.accessor("delayReason", {
      header: "Retard ? Cause ?",
      cell: (info) => {
        const task = info.row.original;
        const progress = task.progress ?? (task.status === "DONE" ? 100 : 0);
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE" && progress < 100;
        const isAssigned = task.assignments?.some((a) => a.user.id === currentUserId);
        const isCreator = task.createdById === currentUserId;
        const canEdit = isAdmin || isAssigned || isCreator;
        const canDelete = isAdmin || isCreator;

        return (
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5">
              {isOverdue && (
                <Badge variant="destructive" className="gap-1 text-[9px] px-1 py-0 animate-pulse">
                  <AlertCircle className="h-3 w-3" /> RETARD
                </Badge>
              )}
              {canEdit ? (
                <input 
                  type="text" 
                  defaultValue={info.getValue() || ""}
                  placeholder={isOverdue ? "Préciser cause..." : "Cause..."}
                  onBlur={(e) => {
                    if (e.target.value !== info.getValue()) {
                      onUpdate(task.id, { delayReason: e.target.value });
                    }
                  }}
                  className="h-6 w-24 text-[11px] border rounded px-1 bg-background"
                />
              ) : (
                <span className="truncate max-w-[120px] text-[11px]">{info.getValue() || "—"}</span>
              )}
            </div>
            {canDelete && onDelete && (
              <button onClick={() => onDelete(task.id)} className="text-muted-foreground hover:text-destructive p-1 rounded" title="Supprimer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    }),
  ], [onUpdate, onDelete, currentUserId, isAdmin, columnHelper]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [tasks, statusFilter, priorityFilter]);

  const table = useReactTable({
    data: filteredTasks,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
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
            {table.getFilteredRowModel().rows.length} tâche(s)
          </span>
          <Button variant="outline" size="sm" onClick={() => exportTasksToCsv(filteredTasks)} className="gap-1.5 text-xs h-9">
            <Download className="h-3.5 w-3.5" /> Exporter CSV
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-muted/80 text-muted-foreground sticky top-0 z-10 border-b backdrop-blur">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-2.5 font-semibold">
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
                    Aucune tâche correspondante.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/40 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
