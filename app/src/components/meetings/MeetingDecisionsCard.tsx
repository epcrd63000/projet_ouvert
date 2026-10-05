"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Plus, Trash2, Calendar, User as UserIcon,
  ArrowRightCircle, ListChecks, Pencil, Check, X, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export interface DecisionItem {
  id: string;
  content: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  taskId?: string | null;
  assignee?: { id: string; name: string } | null;
  task?: { id: string; title: string; status: string; progress: number } | null;
}

export interface TeamMember {
  id: string;
  name: string;
}

interface MeetingDecisionsCardProps {
  meetingId: string;
  decisions: DecisionItem[];
  users: TeamMember[];
  onAddDecision: (content: string, assigneeId: string | null, dueDate: string | null) => Promise<void>;
  onUpdateDecision?: (decisionId: string, content: string, assigneeId: string | null, dueDate: string | null) => Promise<void>;
  onDeleteDecision: (decisionId: string) => Promise<void>;
  onConvertToTask: (decisionId: string) => Promise<void>;
  onConvertAllToTasks?: () => Promise<void>;
}

export function MeetingDecisionsCard({
  meetingId,
  decisions,
  users,
  onAddDecision,
  onUpdateDecision,
  onDeleteDecision,
  onConvertToTask,
  onConvertAllToTasks,
}: MeetingDecisionsCardProps) {
  const [newContent, setNewContent] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [isConvertingAll, setIsConvertingAll] = useState(false);

  // État d'édition inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setIsSubmitting(true);
      await onAddDecision(
        newContent.trim(),
        newAssigneeId || null,
        newDueDate || null
      );
      setNewContent("");
      setNewAssigneeId("");
      setNewDueDate("");
      toast.success("Décision ajoutée avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout de la décision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (decision: DecisionItem) => {
    setEditingId(decision.id);
    setEditContent(decision.content);
    setEditAssigneeId(decision.assigneeId || "");
    setEditDueDate(decision.dueDate ? new Date(decision.dueDate).toISOString().split("T")[0] : "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditAssigneeId("");
    setEditDueDate("");
  };

  const handleSaveEdit = async (decisionId: string) => {
    if (!editContent.trim()) {
      toast.error("Le libellé de l'action ne peut pas être vide");
      return;
    }
    try {
      setIsSavingEdit(true);
      if (onUpdateDecision) {
        await onUpdateDecision(
          decisionId,
          editContent.trim(),
          editAssigneeId || null,
          editDueDate || null
        );
      }
      setEditingId(null);
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConvert = async (decisionId: string) => {
    try {
      setConvertingId(decisionId);
      await onConvertToTask(decisionId);
      toast.success("Tâche créée et liée avec succès !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la conversion en tâche");
    } finally {
      setConvertingId(null);
    }
  };

  const handleConvertAll = async () => {
    if (!onConvertAllToTasks) return;
    try {
      setIsConvertingAll(true);
      await onConvertAllToTasks();
    } finally {
      setIsConvertingAll(false);
    }
  };

  const unconvertedCount = decisions.filter((d) => !d.task).length;

  const renderTaskBadge = (task: NonNullable<DecisionItem["task"]>) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      TODO: { label: "À faire", className: "bg-slate-500/10 text-slate-600 border-slate-200" },
      IN_PROGRESS: { label: `En cours (${task.progress}%)`, className: "bg-blue-500/10 text-blue-600 border-blue-200" },
      DONE: { label: "Terminée", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
      BLOCKED: { label: "Bloquée", className: "bg-rose-500/10 text-rose-600 border-rose-200" },
    };
    const config = statusMap[task.status] || { label: task.status, className: "bg-muted" };

    return (
      <Link href="/kanban" title="Voir dans le Kanban">
        <Badge variant="outline" className={`${config.className} cursor-pointer hover:opacity-80 transition-opacity gap-1`}>
          <CheckCircle2 className="h-3 w-3" />
          {config.label}
        </Badge>
      </Link>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Relevé de Décisions &amp; Plan d&apos;Action ({decisions.length})
          </CardTitle>

          {unconvertedCount > 0 && onConvertAllToTasks && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleConvertAll}
              disabled={isConvertingAll}
              className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isConvertingAll ? "Conversion..." : `Tout convertir en tâches (${unconvertedCount})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Formulaire d'ajout rapide */}
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-muted/30 p-3 rounded-lg border">
          <div className="md:col-span-6">
            <Input
              placeholder="Action / Décision à mener..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Pilote désigné...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="h-8 text-xs px-2"
            />
          </div>
          <div className="md:col-span-1 flex justify-end">
            <Button type="submit" size="sm" className="h-8 w-full px-2" disabled={isSubmitting}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Liste des décisions */}
        <div className="space-y-2">
          {decisions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Aucune décision enregistrée. Utilisez le formulaire ci-dessus ou importez depuis l&apos;IA.
            </p>
          ) : (
            decisions.map((decision) => {
              const isEditing = editingId === decision.id;

              if (isEditing) {
                return (
                  <div
                    key={decision.id}
                    className="p-3 rounded-lg border-2 border-primary/50 bg-primary/5 space-y-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-6">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-8 text-sm bg-background"
                          placeholder="Intitulé de l'action..."
                          autoFocus
                        />
                      </div>
                      <div className="md:col-span-3">
                        <select
                          value={editAssigneeId}
                          onChange={(e) => setEditAssigneeId(e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">Non assigné</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <Input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="h-8 text-xs px-2 bg-background"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={handleCancelEdit}
                        disabled={isSavingEdit}
                      >
                        <X className="h-3.5 w-3.5" /> Annuler
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleSaveEdit(decision.id)}
                        disabled={isSavingEdit}
                      >
                        <Check className="h-3.5 w-3.5" /> {isSavingEdit ? "Enregistrement..." : "Valider"}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={decision.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground break-words">{decision.content}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-muted-foreground">
                      {decision.assignee && (
                        <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                          <UserIcon className="h-3 w-3" />
                          {decision.assignee.name}
                        </span>
                      )}
                      {decision.dueDate && (
                        <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                          <Calendar className="h-3 w-3" />
                          {new Date(decision.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {decision.task ? (
                      renderTaskBadge(decision.task)
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                        onClick={() => handleConvert(decision.id)}
                        disabled={convertingId === decision.id}
                      >
                        <ArrowRightCircle className="h-3.5 w-3.5" />
                        Créer tâche
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => handleStartEdit(decision)}
                      title="Modifier la décision"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteDecision(decision.id)}
                      title="Supprimer la décision"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
