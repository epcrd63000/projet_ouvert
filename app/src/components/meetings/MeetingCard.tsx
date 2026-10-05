"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  CheckSquare,
  Square,
  FileText,
  Sparkles,
  Eye,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MeetingQuickAgendaModal } from "./MeetingQuickAgendaModal";
import {
  extractAgendaSummary,
  extractUserSpecificPreparation,
} from "@/lib/meetings/agendaService";

export interface MeetingListItem {
  id: string;
  title: string;
  scheduledAt: string;
  location?: string | null;
  objectives?: string | null;
  status: string;
  reportContent?: string | null;
  isReportDownloaded: boolean;
  attendees: Array<{ user: { id: string; name: string } }>;
}

interface MeetingCardProps {
  meeting: MeetingListItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  currentUserName?: string | null;
}

export function MeetingCard({
  meeting,
  isSelected,
  onToggleSelect,
  currentUserName,
}: MeetingCardProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNED":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">Planifiée</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-200">En cours</Badge>;
      case "DONE":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">Terminée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const hasAgenda = Boolean(meeting.objectives?.trim());
  const personalPrep = hasAgenda ? extractUserSpecificPreparation(meeting.objectives!, currentUserName) : null;
  const agendaSummary = hasAgenda ? extractAgendaSummary(meeting.objectives!) : null;

  return (
    <>
      <div className="relative rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
        {/* Case à cocher pour sélection / export groupé */}
        <div
          className="absolute top-4 left-4 z-10 cursor-pointer"
          onClick={() => onToggleSelect(meeting.id)}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground hover:text-primary" />
          )}
        </div>

        <div className="pl-8 space-y-3">
          {/* Titre & Statut */}
          <div className="flex justify-between items-start gap-2">
            <h3
              className={`font-semibold text-lg line-clamp-1 ${
                meeting.isReportDownloaded ? "text-green-600" : "text-foreground"
              }`}
              title={meeting.title}
            >
              {meeting.title}
            </h3>
            {getStatusBadge(meeting.status)}
          </div>

          {/* Horaires et Lieu */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="capitalize">
                {format(new Date(meeting.scheduledAt), "EEEE d MMMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(meeting.scheduledAt), "HH:mm", { locale: fr })}
              </span>
              {meeting.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {meeting.location}
                </span>
              )}
            </div>
          </div>

          {/* Encadré Ordre du Jour & Préparatifs */}
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
                  onClick={() => setIsQuickViewOpen(true)}
                  className="h-6 px-2 text-[11px] gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  <Eye className="h-3 w-3" />
                  Aperçu
                </Button>
              )}
            </div>

            {/* Consigne personnelle mise en avant pour le membre */}
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

          {/* Participants */}
          <div className="pt-2 border-t text-xs">
            <span className="font-medium text-foreground block mb-1">Participants :</span>
            <p className="text-muted-foreground line-clamp-1">
              {meeting.attendees.map((a) => a.user.name).join(", ") || "Aucun"}
            </p>
          </div>
        </div>

        {/* Bouton d'action principal */}
        <div className="pt-2">
          <Link href={`/meetings/${meeting.id}`}>
            <Button variant={meeting.status === "DONE" ? "outline" : "default"} className="w-full text-xs font-medium gap-1.5">
              {meeting.status === "DONE" ? "Voir le compte rendu" : "Préparer la réunion"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Modale d'aperçu rapide */}
      <MeetingQuickAgendaModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        meeting={meeting}
        currentUserName={currentUserName}
      />
    </>
  );
}
