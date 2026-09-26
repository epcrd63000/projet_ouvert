"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

/**
 * Colonne droppable du Kanban. Accepte les cartes de tâches par drag & drop.
 */
export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border-t-4 bg-muted/30 p-3 transition-colors min-h-[300px]",
        color,
        isOver && "bg-muted/60 ring-2 ring-primary/30"
      )}
    >
      {/* En-tête de colonne */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {count}
        </span>
      </div>

      {/* Liste des cartes */}
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
