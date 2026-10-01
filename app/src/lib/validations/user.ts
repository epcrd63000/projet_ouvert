import { z } from "zod";

/**
 * Schéma de validation pour la création d'un utilisateur (ADMIN).
 */
export const createUserSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères").max(100),
  email: z.string().email("Adresse email invalide").toLowerCase().trim(),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  avatarUrl: z.string().url("URL d'avatar invalide").optional().nullable(),
});

/**
 * Schéma de validation pour la mise à jour d'un utilisateur.
 */
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  reminderHoursBefore: z.number().int().min(1).max(168).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
