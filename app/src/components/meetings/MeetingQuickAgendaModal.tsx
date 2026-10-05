"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Share2, Check, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { marked } from "marked";
import { toast } from "sonner";
import {
  formatDiscordAnnouncement,
  extractUserSpecificPreparation,
  MeetingContext,
} from "@/lib/meetings/agendaService";

interface MeetingQuickAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingContext & {
    status: string;
    objectives?: string | null;
  };
  currentUserName?: string | null;
}

export function MeetingQuickAgendaModal({
  isOpen,
  onClose,
  meeting,
  currentUserName,
}: MeetingQuickAgendaModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const content = meeting.objectives || "";
  const renderedHtml = content.trim()
    ? (marked.parse(content, { breaks: true }) as string)
    : "<p class='italic text-muted-foreground'>Aucun ordre du jour rédigé pour le moment.</p>";

  const personalTask = extractUserSpecificPreparation(content, currentUserName);

  const handleCopy = async () => {
    try {
      const announcement = formatDiscordAnnouncement(meeting, content);
      await navigator.clipboard.writeText(announcement);
      setIsCopied(true);
      toast.success("Annonce copiée dans le presse-papier !");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xl font-bold">{meeting.title}</DialogTitle>
            <Badge variant="outline" className="text-xs">
              {meeting.status === "DONE" ? "Terminée" : "À préparer"}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(meeting.scheduledAt), "EEEE d MMMM yyyy", { locale: fr })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(meeting.scheduledAt), "HH:mm", { locale: fr })}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {meeting.location}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Encadré d'alerte spécifique au membre connecté */}
        {personalTask && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
            <div>
              <span className="font-semibold block">Votre préparatif pour cette réunion :</span>
              <p className="mt-0.5 text-indigo-950 dark:text-indigo-100">{personalTask}</p>
            </div>
          </div>
        )}

        {/* Corps Markdown de l'ordre du jour */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50 max-h-96 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />

        <DialogFooter className="flex-row justify-between sm:justify-between items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800"
          >
            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {isCopied ? "Copié !" : "Copier l'annonce"}
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Fermer
            </Button>
            <Link href={`/meetings/${meeting.id}`}>
              <Button size="sm" className="text-xs gap-1">
                Ouvrir la fiche <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
