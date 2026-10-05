"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, MessageSquare } from "lucide-react";

interface CommentDialogProps {
  isOpen: boolean;
  title: string;
  initialComment: string;
  onClose: () => void;
  onSave: (comment: string) => Promise<void>;
}

/**
 * Modale permettant de consulter et d'éditer le commentaire d'une ligne de financement ou dépense.
 */
export default function CommentDialog({
  isOpen,
  title,
  initialComment,
  onClose,
  onSave,
}: CommentDialogProps) {
  const [comment, setComment] = useState(initialComment);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setComment(initialComment);
  }, [initialComment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(comment);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du commentaire");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl border w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">{title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry-comment">Commentaire / Justification / Motif</Label>
            <textarea
              id="entry-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajoutez des détails, liens marchands ou explications d'annulation..."
              className="w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Fermer
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
