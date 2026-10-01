import { z } from "zod";

/**
 * Schéma de validation pour la création d'un événement manuel.
 */
export const createEventSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").max(200),
  description: z.string().max(2000).optional().nullable(),
  startAt: z.string().datetime("Date de début invalide"),
  endAt: z.string().datetime("Date de fin invalide"),
  allDay: z.boolean().default(false),
  visibility: z.enum(["PERSONAL", "TEAM"]).default("TEAM"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
