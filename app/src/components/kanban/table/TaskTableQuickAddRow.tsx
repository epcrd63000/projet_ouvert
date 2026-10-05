"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserSummary } from "@/hooks/useTasks";
import type { TaskFormData } from "../TaskModal";

interface TaskTableQuickAddRowProps {
  users: UserSummary[];
  currentUserId: string;
  onCreate?: (data: TaskFormData) => Promise<void>;
}

/**
 * Ligne d'insertion rapide inline en bas du tableau M2V5.
 */
export function TaskTableQuickAddRow({
  users,
  currentUserId,
  onCreate,
}: TaskTableQuickAddRowProps) {
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState(currentUserId || "");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "CRITICAL">("NORMAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!onCreate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: "",
        priority,
        dueDate: dueDate || "",
        assigneeIds: assigneeId ? [assigneeId] : [],
      });
      setTitle("");
      setDueDate("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 p-2.5 bg-muted/20 border-t hover:bg-muted/30 transition-colors text-xs"
    >
      <div className="flex items-center gap-1.5 text-muted-foreground font-medium shrink-0">
        <Plus className="h-4 w-4 text-primary" />
        <span>Nouvelle ligne :</span>
      </div>

      {/* Titre de la tâche */}
      <Input
        placeholder="Intitulé de la tâche..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 text-xs flex-1 min-w-[180px] bg-background"
        disabled={isSubmitting}
      />

      {/* Pilote */}
      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="h-8 text-xs border rounded-md px-2 bg-background max-w-[140px]"
        disabled={isSubmitting}
        aria-label="Assigner à"
      >
        <option value="">Non assigné</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      {/* Échéance */}
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="h-8 text-xs border rounded-md px-2 bg-background font-mono"
        disabled={isSubmitting}
        aria-label="Date d'échéance"
      />

      {/* Priorité */}
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as "LOW" | "NORMAL" | "HIGH" | "CRITICAL")}
        className="h-8 text-xs border rounded-md px-2 bg-background"
        disabled={isSubmitting}
        aria-label="Priorité"
      >
        <option value="LOW">Basse</option>
        <option value="NORMAL">Normale</option>
        <option value="HIGH">Haute</option>
        <option value="CRITICAL">Critique</option>
      </select>

      {/* Bouton validation */}
      <Button
        type="submit"
        size="sm"
        disabled={!title.trim() || isSubmitting}
        className="h-8 px-3 text-xs gap-1"
      >
        <Plus className="h-3.5 w-3.5" />
        {isSubmitting ? "Ajout..." : "Ajouter"}
      </Button>
    </form>
  );
}
