/**
 * @file meetingEditService.ts
 * Logique métier et utilitaires pour la modification des informations d'une réunion.
 * Gère le formatage des dates pour les formulaires HTML5, le différentiel des participants
 * et la synchronisation avec les événements de calendrier.
 */

import { z } from "zod";

/**
 * Schéma de validation pour la mise à jour des données d'une réunion.
 */
export const meetingEditSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(100),
  scheduledAt: z.string().min(1, "La date et l'heure sont requises"),
  location: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]),
  attendeeIds: z.array(z.string()).default([]),
});

export type MeetingEditPayload = z.infer<typeof meetingEditSchema>;

/**
 * Formate une date ISO ou objet Date pour l'attribut `value` d'un `<input type="datetime-local">` (YYYY-MM-DDTHH:mm).
 */
export function formatToDateTimeLocal(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convertit la valeur saisie dans un input `datetime-local` vers une chaîne ISO 8601 UTC standard.
 */
export function parseDateTimeLocalToIso(val: string): string {
  if (!val || typeof val !== "string") {
    throw new Error("Date invalide : la valeur ne peut pas être vide");
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    throw new Error(`Date invalide : impossible d'analyser "${val}"`);
  }
  return d.toISOString();
}

export interface AttendeeDiff {
  toAdd: string[];
  toDelete: string[];
  unchanged: string[];
}

/**
 * Calcule le différentiel entre les participants actuels et les nouveaux participants sélectionnés.
 * Permet d'éviter de réinitialiser le statut de présence des participants inchangés.
 */
export function computeAttendeeDiff(
  existingUserIds: string[],
  targetUserIds: string[]
): AttendeeDiff {
  const existingSet = new Set(existingUserIds);
  const targetSet = new Set(targetUserIds);

  const toAdd = targetUserIds.filter((id) => !existingSet.has(id));
  const toDelete = existingUserIds.filter((id) => !targetSet.has(id));
  const unchanged = existingUserIds.filter((id) => targetSet.has(id));

  return { toAdd, toDelete, unchanged };
}

export interface CalendarEventSyncData {
  title?: string;
  startAt?: Date;
  endAt?: Date;
  description?: string;
}

/**
 * Construit le payload de synchronisation pour l'événement de calendrier associé à la réunion.
 */
export function buildCalendarEventSyncData(data: {
  title?: string;
  scheduledAt?: string | Date;
  notes?: string | null;
  durationMinutes?: number;
}): CalendarEventSyncData {
  const payload: CalendarEventSyncData = {};

  if (data.title) {
    payload.title = data.title;
  }

  if (data.scheduledAt) {
    const startDate = new Date(data.scheduledAt);
    if (!isNaN(startDate.getTime())) {
      const duration = data.durationMinutes || 60;
      payload.startAt = startDate;
      payload.endAt = new Date(startDate.getTime() + duration * 60 * 1000);
    }
  }

  if (data.notes !== undefined) {
    payload.description = data.notes || "";
  }

  return payload;
}
