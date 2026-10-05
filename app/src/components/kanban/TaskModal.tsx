"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Plus, Check } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  dueDate: string;
  assigneeIds: string[];
}

/**
 * Modale de création d'une nouvelle tâche avec sélection de priorité et d'assignés.
 */
export function TaskModal({ isOpen, onClose, onSubmit, users, currentUserId, isAdmin }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskFormData["priority"]>("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setPriority("NORMAL");
      setDueDate("");
      // Pré-sélectionner l'utilisateur connecté par défaut s'il est valide
      setAssigneeIds(currentUserId && currentUserId.trim() !== "" ? [currentUserId] : []);
    }
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) => {
      const filtered = prev.filter((id) => id && id.trim() !== "");
      return filtered.includes(userId)
        ? filtered.filter((id) => id !== userId)
        : [...filtered, userId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const validAssignees = assigneeIds.filter((id) => id && id.trim() !== "");
    // Si aucun membre sélectionné, assigner par défaut à l'utilisateur courant
    const finalAssignees =
      validAssignees.length > 0
        ? validAssignees
        : currentUserId && currentUserId.trim() !== ""
        ? [currentUserId]
        : [];

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate,
      assigneeIds: finalAssignees,
    });
    setIsSubmitting(false);
    onClose();
  };

  const assignableUsers = users; // All users can be assigned now

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
          <Plus className="h-5 w-5" /> Nouvelle tâche
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-1">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Réaliser le prototype PCB"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="desc">Description</Label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              placeholder="Détails de la tâche..."
            />
          </div>

          {/* Priorité */}
          <div className="space-y-1">
            <Label>Priorité</Label>
            <div className="flex gap-2">
              {(["LOW", "NORMAL", "HIGH", "CRITICAL"] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriority(p)}
                >
                  {p === "LOW" && "Basse"}
                  {p === "NORMAL" && "Normale"}
                  {p === "HIGH" && "Haute"}
                  {p === "CRITICAL" && "Critique"}
                </Button>
              ))}
            </div>
          </div>

          {/* Date d'échéance */}
          <div className="space-y-1">
            <Label htmlFor="due">Date d&apos;échéance</Label>
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Assignés */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Assignation (travail en binôme / équipe)</Label>
              <span className="text-xs text-muted-foreground">
                {assigneeIds.length} membre{assigneeIds.length > 1 ? "s" : ""} sélectionné{assigneeIds.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {users.map((user) => {
                const isSelected = assigneeIds.includes(user.id);
                const isMe = user.id === currentUserId;
                return (
                  <Button
                    key={user.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAssignee(user.id)}
                    className="gap-1.5"
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    <span>{user.name}</span>
                    {isMe && <span className="text-[10px] opacity-80">(Moi)</span>}
                  </Button>
                );
              })}
            </div>
            {assigneeIds.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ℹ️ Aucun membre sélectionné : la tâche vous sera automatiquement assignée.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Création..." : "Créer la tâche"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
