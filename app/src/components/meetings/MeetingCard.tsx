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
  ArrowRight,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MeetingQuickAgendaModal } from "./MeetingQuickAgendaModal";
import { MeetingCardAgendaBox } from "./MeetingCardAgendaBox";
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
  onEdit?: (meeting: MeetingListItem) => void;
  currentUserName?: string | null;
}

export function MeetingCard({
  meeting,
  isSelected,
  onToggleSelect,
  onEdit,
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
          <MeetingCardAgendaBox
            hasAgenda={hasAgenda}
            personalPrep={personalPrep}
            agendaSummary={agendaSummary}
            onOpenQuickView={() => setIsQuickViewOpen(true)}
          />

          {/* Participants */}
          <div className="pt-2 border-t text-xs">
            <span className="font-medium text-foreground block mb-1">Participants :</span>
            <p className="text-muted-foreground line-clamp-1">
              {meeting.attendees.map((a) => a.user.name).join(", ") || "Aucun"}
            </p>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="pt-2 flex items-center gap-2">
          <Link href={`/meetings/${meeting.id}`} className="flex-1">
            <Button
              variant={meeting.status === "DONE" ? "outline" : "default"}
              className="w-full text-xs font-medium gap-1.5"
            >
              {meeting.status === "DONE" ? "Voir le compte rendu" : "Préparer la réunion"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>

          {onEdit && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(meeting)}
              title="Modifier les informations"
              className="h-9 w-9 shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
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
