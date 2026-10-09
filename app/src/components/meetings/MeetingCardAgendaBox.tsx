"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Sparkles } from "lucide-react";

interface MeetingCardAgendaBoxProps {
  hasAgenda: boolean;
  personalPrep: string | null;
  agendaSummary: string | null;
  onOpenQuickView: () => void;
}

export function MeetingCardAgendaBox({
  hasAgenda,
  personalPrep,
  agendaSummary,
  onOpenQuickView,
}: MeetingCardAgendaBoxProps) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-indigo-500" />
          Ordre du Jour &amp; Préparation
        </span>
        {hasAgenda && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenQuickView}
            className="h-6 px-2 text-[11px] gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Eye className="h-3 w-3" />
            Aperçu
          </Button>
        )}
      </div>

      {personalPrep ? (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded p-2 text-indigo-900 dark:text-indigo-200">
          <span className="font-medium flex items-center gap-1 text-[11px]">
            <Sparkles className="h-3 w-3 text-indigo-500" /> Vos préparatifs :
          </span>
          <p className="line-clamp-2 mt-0.5 text-[11px] font-normal">{personalPrep}</p>
        </div>
      ) : hasAgenda ? (
        <p className="text-muted-foreground line-clamp-2 text-[11px]">
          {agendaSummary}
        </p>
      ) : (
        <p className="text-muted-foreground italic text-[11px]">
          En attente de rédaction par le chef de projet.
        </p>
      )}
    </div>
  );
}
