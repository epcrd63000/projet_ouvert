"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, Edit3, Eye, Save, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatDiscordAnnouncement, MeetingContext } from "@/lib/meetings/agendaService";
import { marked } from "marked";

interface MeetingAgendaCardProps {
  meeting: MeetingContext;
  agendaContent: string;
  onSaveAgenda: (content: string) => Promise<void>;
  onOpenAiAssistant: () => void;
}

export function MeetingAgendaCard({
  meeting,
  agendaContent,
  onSaveAgenda,
  onOpenAiAssistant,
}: MeetingAgendaCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(agendaContent || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Synchronisation si le contenu change de l'extérieur (ex: IA)
  React.useEffect(() => {
    setContent(agendaContent || "");
  }, [agendaContent]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveAgenda(content);
      setIsEditing(false);
      toast.success("Ordre du jour enregistré !");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAnnouncement = async () => {
    if (!content.trim()) {
      toast.error("Veuillez d'abord renseigner ou générer un ordre du jour");
      return;
    }
    try {
      const announcement = formatDiscordAnnouncement(meeting, content);
      await navigator.clipboard.writeText(announcement);
      setIsCopied(true);
      toast.success("Annonce prête copiée ! Collez-la sur Discord, WhatsApp ou dans votre mail d'équipe.");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error("Erreur lors de la copie de l'annonce");
    }
  };

  const renderedHtml = content.trim()
    ? (marked.parse(content, { breaks: true }) as string)
    : "<p class='text-muted-foreground italic text-xs'>Aucun ordre du jour rédigé pour le moment. Utilisez l'Assistant IA pour le générer à partir de vos notes vocales !</p>";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      {/* En-tête de la carte avec actions rapides */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">
            1. Ordre du Jour &amp; Préparation
          </h2>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Bouton Assistant IA */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAiAssistant}
            className="h-7 text-xs gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Assistant IA (Ordre du jour)
          </Button>

          {/* Bouton Copier pour Discord / WhatsApp */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAnnouncement}
            className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {isCopied ? "Copié !" : "Copier l'annonce (Discord/WhatsApp)"}
          </Button>

          {/* Bascule Mode Édition / Aperçu */}
          {isEditing ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 text-xs gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Sauvegarde..." : "Enregistrer"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 text-xs gap-1"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* Contenu : Aperçu Markdown stylisé ou Champ d'édition */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Écrivez ou collez l'ordre du jour et les préparatifs en Markdown..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-xs font-mono min-h-[140px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setContent(agendaContent || "");
                setIsEditing(false);
              }}
              className="h-7 text-xs"
            >
              Annuler
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 text-xs gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed bg-muted/30 p-3.5 rounded-lg border border-border/50"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      )}
    </div>
  );
}
