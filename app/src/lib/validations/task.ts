import { z } from "zod";

/**
 * Schéma de validation pour la création d'une tâche.
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).default("TODO"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
  dueDate: z.string().datetime().optional().nullable(),
  workload: z.string().max(100).optional().nullable(),
  deliverables: z.string().max(1000).optional().nullable(),
  validationCriteria: z.string().max(1000).optional().nullable(),
  progress: z.number().int().min(0).max(100).default(0),
  delayReason: z.string().max(1000).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  meetingId: z.string().uuid().optional().nullable(),
  assigneeIds: z.array(z.string().uuid()).optional().default([]),
});

/**
 * Schéma de validation pour la mise à jour d'une tâche.
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
  position: z.number().int().min(0).optional(),
  dueDate: z.string().optional().nullable(),
  workload: z.string().max(100).optional().nullable(),
  deliverables: z.string().max(1000).optional().nullable(),
  validationCriteria: z.string().max(1000).optional().nullable(),
  validator: z.string().max(1000).optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
  delayReason: z.string().max(1000).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Schéma de validation pour l'assignation d'un membre à une tâche.
 */
export const assignTaskSchema = z.object({
  userId: z.string().uuid("ID utilisateur invalide"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
