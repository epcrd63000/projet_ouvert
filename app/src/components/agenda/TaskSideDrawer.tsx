"use client";

import React, { useEffect } from "react";
import { AgendaTask, TaskStatusType } from "./agendaTypes";
import { TaskDrawerList } from "./TaskDrawerList";
import { TaskDrawerDetail } from "./TaskDrawerDetail";
import { X, ArrowLeft, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AgendaTask[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatusType) => Promise<void>;
  activeTab: "mine" | "all";
  onTabChange: (tab: "mine" | "all") => void;
}

/**
 * Volet latéral coulissant (Drawer) pour la gestion et le suivi des tâches dans l'Agenda.
 */
export function TaskSideDrawer({
  isOpen,
  onClose,
  tasks,
  selectedTaskId,
  onSelectTask,
  onStatusChange,
  activeTab,
  onTabChange,
}: TaskSideDrawerProps) {
  const selectedTask = tasks.find((t) => t.originalId === selectedTaskId);

  // Gestion de la touche Échap pour fermer le volet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (selectedTaskId) {
          onSelectTask(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedTaskId, onSelectTask, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fond semi-transparent avec fermeture au clic */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal du volet */}
      <div className="relative z-50 flex h-full w-full max-w-md flex-col border-l bg-background shadow-2xl duration-200 animate-in slide-in-from-right">
        {/* En-tête du volet */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          {selectedTask ? (
            <button
              type="button"
              onClick={() => onSelectTask(null)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Retour à la liste
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold tracking-tight">Tâches du projet</h2>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>

        {/* Corps défilant du volet */}
        <div className="flex-1 overflow-y-auto">
          {selectedTask ? (
            <TaskDrawerDetail task={selectedTask} onStatusChange={onStatusChange} />
          ) : (
            <TaskDrawerList
              tasks={tasks}
              activeTab={activeTab}
              onTabChange={onTabChange}
              onSelectTask={onSelectTask}
            />
          )}
        </div>
      </div>
    </div>
  );
}
