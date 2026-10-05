"use client";

import React, { useState, useEffect } from "react";
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
import { Bot, Copy, Sparkles, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { parseAiMeetingReport, ParsedMeetingReport, UserCandidate } from "@/lib/meetings/aiReportParser";

interface MeetingAiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: {
    id: string;
    title: string;
    scheduledAt: string;
    attendees: Array<{ status: string; user: { name: string } }>;
  };
  users: UserCandidate[];
  onApplyReport: (parsed: ParsedMeetingReport) => Promise<void>;
}

const DEFAULT_PROMPT_TEMPLATE = `Tu es le secrétaire technique et assistant IA de l'équipe travaillant sur le projet 'Voilier MINIMOCA' (IMT Nord Europe).
Ton rôle est de générer un compte rendu professionnel, précis, concis et orienté actions à partir des notes brutes ou de la transcription de notre réunion.
L'équipe est composée de 6 membres : Etienne (Chef de projet), Liam (Second), Hugo, Milane, Solal, Peter (Membres).

Réponds IMPÉRATIVEMENT en respectant scrupuleusement la structure suivante délimitée par ces 3 balises exactes :

[OBJECTIFS]
- Objectif 1 abordé
- Objectif 2 abordé
[/OBJECTIFS]

[SYNTHESE]
Rédige ici en Markdown le compte rendu complet et structuré des échanges :
### Points abordés
- Point 1
- Point 2
### Déroulé
Résumé des discussions et arguments échangés.
### Résumé technique
Détails sur l'ingénierie navale, les composants, etc.
[/SYNTHESE]

[DECISIONS]
Pour chaque action validée, ajoute une ligne STRICTEMENT selon le format suivant (très important pour le parsing) :
- [PrénomResponsable] [DateLimite AAAA-MM-JJ ou JJ/MM/AAAA] Intitulé clair de l'action à mener
(Exemple : - [Etienne] [2026-10-25] Valider le design de la coque)
(Exemple : - [Liam] [31/10/2026] Commander les servos de barre)
[/DECISIONS]`;

export function MeetingAiAssistantDrawer({
  isOpen,
  onClose,
  meeting,
  users,
  onApplyReport,
}: MeetingAiAssistantDrawerProps) {
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_PROMPT_TEMPLATE);
  const [rawNotes, setRawNotes] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Charger le prompt par défaut depuis l'API si disponible
  useEffect(() => {
    async function loadPrompt() {
      try {
        const res = await fetch("/api/prompts");
        if (res.ok) {
          const prompts = await res.json();
          const crPrompt = prompts.find((p: any) =>
            p.title.toLowerCase().includes("compte rendu")
          );
          if (crPrompt && crPrompt.content) {
            setPromptTemplate(crPrompt.content);
          }
        }
      } catch (err) {
        console.error("Erreur chargement prompt par défaut:", err);
      }
    }
    if (isOpen) loadPrompt();
  }, [isOpen]);

  const handleSaveTemplateAsDefault = async () => {
    try {
      setIsSavingTemplate(true);
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Générateur de Compte Rendu de Réunion (Modèle Officiel)",
          content: promptTemplate,
        }),
      });
      if (res.ok) {
        toast.success("Modèle de prompt enregistré par défaut !");
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'enregistrer le modèle de prompt");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const getFullCompiledPrompt = () => {
    const presentList = meeting.attendees
      .filter((a) => a.status === "PRESENT")
      .map((a) => a.user.name)
      .join(", ") || "Aucun";

    const excusedList = meeting.attendees
      .filter((a) => a.status === "EXCUSED")
      .map((a) => a.user.name)
      .join(", ") || "Aucun";

    const contextHeader = `[CONTEXTE RÉUNION MINIMOCA]
Titre : ${meeting.title}
Date : ${new Date(meeting.scheduledAt).toLocaleDateString("fr-FR")}
Présents : ${presentList}
Excusés : ${excusedList}

[NOTES BRUTES / TRANSCRIPTION]
${rawNotes || "(Notes prises en séance par l'équipe)"}
---------------------------------------------------\n\n`;

    return contextHeader + promptTemplate;
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getFullCompiledPrompt());
      setIsCopied(true);
      toast.success("Prompt complet copié ! Collez-le dans ChatGPT ou Gemini.");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleApplyAiOutput = async () => {
    if (!aiOutput.trim()) {
      toast.error("Veuillez coller la réponse de l'IA");
      return;
    }

    try {
      setIsApplying(true);
      const parsed = parseAiMeetingReport(aiOutput, users);
      await onApplyReport(parsed);
      toast.success("Compte rendu et décisions ventilés avec succès !");
      setAiOutput("");
      setRawNotes("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'application du compte rendu");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary" />
            Assistant IA de Compte Rendu (Zéro Clé Requise)
          </DialogTitle>
          <DialogDescription>
            Copiez le prompt compilé pour ChatGPT/Gemini, puis collez la réponse pour ventiler automatiquement le compte rendu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Étape 1 : Template modifiable */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                1. Consigne IA (Modifiable sur le site)
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-primary"
                onClick={handleSaveTemplateAsDefault}
                disabled={isSavingTemplate}
              >
                <Save className="h-3 w-3" />
                Enregistrer par défaut
              </Button>
            </div>
            <Textarea
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              className="font-mono text-xs h-28"
            />
          </div>

          {/* Étape 2 : Notes brutes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              2. Vos notes brutes ou transcription vocale
            </Label>
            <Textarea
              placeholder="Collez ici les notes brutes prises pendant la réunion, idées en vrac, transcriptions..."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              className="text-xs h-24"
            />
          </div>

          {/* Bouton de copie du prompt assemblé */}
          <Button onClick={handleCopyPrompt} className="w-full gap-2 bg-primary hover:bg-primary/90 text-sm">
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? "Prompt copié dans le presse-papier !" : "Copier le Prompt Complet (Prêt pour ChatGPT / Gemini)"}
          </Button>

          {/* Étape 3 : Réponse de l'IA */}
          <div className="space-y-1.5 pt-2 border-t">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              3. Coller la réponse fournie par l&apos;IA
            </Label>
            <Textarea
              placeholder="Collez ici la réponse textuelle de ChatGPT ou Gemini..."
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
          <Button onClick={handleApplyAiOutput} disabled={isApplying || !aiOutput.trim()} className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Ventiler &amp; Appliquer au Compte Rendu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
