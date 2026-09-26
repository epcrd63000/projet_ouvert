"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Plus } from "lucide-react";

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

  if (!isOpen) return null;

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ title, description, priority, dueDate, assigneeIds });
    setIsSubmitting(false);
    // Réinitialiser le formulaire
    setTitle("");
    setDescription("");
    setPriority("NORMAL");
    setDueDate("");
    setAssigneeIds([]);
    onClose();
  };

  const assignableUsers = isAdmin ? users : users.filter(u => u.id === currentUserId);

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
            <Label>Assigner à</Label>
            <div className="flex flex-wrap gap-2">
              {assignableUsers.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant={assigneeIds.includes(user.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAssignee(user.id)}
                >
                  {user.name}
                </Button>
              ))}
            </div>
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
