"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TaskTableDeleteDialogProps {
  taskId: string;
  taskTitle: string;
  onDelete: (taskId: string) => void;
}

/**
 * Boîte de confirmation popover pour la suppression sécurisée d'une tâche M2V5.
 */
export function TaskTableDeleteDialog({
  taskId,
  taskTitle,
  onDelete,
}: TaskTableDeleteDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onDelete(taskId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
          title="Supprimer la tâche"
          aria-label="Supprimer la tâche"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 text-xs" align="end">
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Confirmer la suppression ?</p>
              <p className="text-muted-foreground text-[11px] line-clamp-2 mt-0.5">
                « {taskTitle} » sera définitivement supprimée.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 px-2 text-[11px]"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              className="h-7 px-2 text-[11px]"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
