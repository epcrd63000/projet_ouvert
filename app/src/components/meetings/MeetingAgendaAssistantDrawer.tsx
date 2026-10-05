"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Copy, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_AGENDA_PROMPT_TEMPLATE,
  compileAgendaPrompt,
  MeetingContext,
} from "@/lib/meetings/agendaService";

interface MeetingAgendaAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingContext;
  onApplyAgenda: (agendaMarkdown: string) => Promise<void>;
}

export function MeetingAgendaAssistantDrawer({
  isOpen,
  onClose,
  meeting,
  onApplyAgenda,
}: MeetingAgendaAssistantDrawerProps) {
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_AGENDA_PROMPT_TEMPLATE);
  const [rawNotes, setRawNotes] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      const fullPrompt = compileAgendaPrompt(meeting, rawNotes);
      await navigator.clipboard.writeText(fullPrompt);
      setIsCopied(true);
      toast.success("Prompt d'ordre du jour copié ! Collez-le dans ChatGPT ou Gemini.");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error("Erreur lors de la copie du prompt");
    }
  };

  const handleApply = async () => {
    if (!aiOutput.trim()) {
      toast.error("Veuillez coller la réponse générée par l'IA");
      return;
    }

    try {
      setIsApplying(true);
      await onApplyAgenda(aiOutput.trim());
      toast.success("Ordre du jour appliqué et synchronisé avec succès !");
      setAiOutput("");
      setRawNotes("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'application de l'ordre du jour");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-indigo-500" />
            Assistant IA d&apos;Ordre du Jour (Zéro Clé Requise)
          </DialogTitle>
          <DialogDescription>
            Dictez ou écrivez vos idées en vrac. L&apos;IA structure l&apos;ordre du jour et les préparatifs pour toute l&apos;équipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Étape 1 : Vos notes vocales brutes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              1. Vos notes brutes ou transcription vocale
            </Label>
            <Textarea
              placeholder="Ex : Hugo doit ramener les fichiers CAO, Solal prépare le plan de voilure, Liam fait le point sur les devis..."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              className="text-xs h-28"
            />
          </div>

          {/* Étape 2 : Consigne du prompt */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              2. Modèle de consigne IA (Modifiable si besoin)
            </Label>
            <Textarea
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              className="font-mono text-xs h-28"
            />
          </div>

          {/* Bouton de copie du prompt assemblé */}
          <Button onClick={handleCopyPrompt} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-sm text-white">
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? "Prompt copié dans le presse-papier !" : "Copier le Prompt Complet (Prêt pour ChatGPT / Gemini)"}
          </Button>

          {/* Étape 3 : Réponse de l'IA */}
          <div className="space-y-1.5 pt-2 border-t">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              3. Coller la réponse fournie par l&apos;IA (Markdown)
            </Label>
            <Textarea
              placeholder="Collez ici la réponse textuelle en Markdown retournée par ChatGPT ou Gemini..."
              value={aiOutput}
              onChange={(e) => setAiOutput(e.target.value)}
              className="font-mono text-xs h-32"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Fermer
          </Button>
          <Button onClick={handleApply} disabled={isApplying || !aiOutput.trim()} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
            <FileText className="h-4 w-4" />
            Appliquer à l&apos;Ordre du Jour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
