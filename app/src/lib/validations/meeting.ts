import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(100),
  scheduledAt: z.string().datetime(), // format ISO 8601
  notes: z.string().optional().nullable(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]).default("PLANNED"),
  attendeeIds: z.array(z.string()).default([]),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]).optional(),
  attendeeIds: z.array(z.string()).optional(),
});
