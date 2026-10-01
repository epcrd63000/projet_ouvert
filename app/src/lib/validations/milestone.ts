import { z } from "zod";

/**
 * Schéma de validation pour la création d'un jalon Gantt.
 */
export const createMilestoneSchema = z.object({
  name: z.string().min(1, "Le nom du jalon est obligatoire").max(150),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().datetime("Date de début invalide"),
  endDate: z.string().datetime("Date de fin invalide"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format de couleur hexadécimal invalide (#RRGGBB)").default("#6366f1"),
  status: z.enum(["UPCOMING", "IN_PROGRESS", "ACHIEVED", "MISSED"]).default("UPCOMING"),
});

/**
 * Schéma de validation pour la mise à jour d'un jalon Gantt.
 */
export const updateMilestoneSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: z.enum(["UPCOMING", "IN_PROGRESS", "ACHIEVED", "MISSED"]).optional(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
