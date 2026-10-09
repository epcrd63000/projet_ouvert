"use client";

import React from "react";
import { Calendar, MapPin, Target, CheckCircle } from "lucide-react";

interface MeetingModalFieldsProps {
  title: string;
  onTitleChange: (val: string) => void;
  scheduledAt: string;
  onScheduledAtChange: (val: string) => void;
  status: "PLANNED" | "IN_PROGRESS" | "DONE";
  onStatusChange: (val: "PLANNED" | "IN_PROGRESS" | "DONE") => void;
  location: string;
  onLocationChange: (val: string) => void;
  objectives: string;
  onObjectivesChange: (val: string) => void;
}

export function MeetingModalFields({
  title,
  onTitleChange,
  scheduledAt,
  onScheduledAtChange,
  status,
  onStatusChange,
  location,
  onLocationChange,
  objectives,
  onObjectivesChange,
}: MeetingModalFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
          Titre de la réunion *
        </label>
        <input
          type="text"
          required
          className="w-full rounded-md border p-2 text-sm bg-background"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ex: Revue de sprint, Point conception..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Date et heure *
          </label>
          <input
            type="datetime-local"
            required
            className="w-full rounded-md border p-2 text-sm bg-background"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Statut
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as any)}
            className="w-full rounded-md border p-2 text-sm bg-background"
          >
            <option value="PLANNED">Planifiée</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="DONE">Terminée</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Lieu
        </label>
        <input
          type="text"
          className="w-full rounded-md border p-2 text-sm bg-background"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Ex: Salle 301, FabLab, Teams..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
          <Target className="h-3 w-3" /> Objectifs & Ordre du jour
        </label>
        <textarea
          className="w-full rounded-md border p-2 text-sm bg-background"
          rows={3}
          value={objectives}
          onChange={(e) => onObjectivesChange(e.target.value)}
          placeholder="Ex: Validation de la carène, attribution des tâches..."
        />
      </div>
    </>
  );
}
