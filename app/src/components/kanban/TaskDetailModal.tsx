"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckSquare } from "lucide-react";
import { TaskDetailForm } from "./TaskDetailForm";
import type { KanbanTask } from "./KanbanBoard";
import type { UserSummary } from "@/hooks/useTasks";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  users: UserSummary[];
  currentUserId: string;
  isAdmin: boolean;
  onUpdate: (taskId: string, data: any) => Promise<void>; // eslint-disable-line
  onDelete?: (taskId: string) => void;
}

/**
 * Modale de consultation et de modification d'une tâche existante.
 * Accessible en cliquant directement sur la carte de tâche dans le Kanban ou le tableau.
 */
export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  users,
  currentUserId,
  isAdmin,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-w-[95vw] p-5">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span>Modifier la tâche</span>
          </DialogTitle>
        </DialogHeader>

        <TaskDetailForm
          task={task}
          users={users}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onSave={onUpdate}
          onDelete={onDelete}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
