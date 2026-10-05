import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateAttendanceSchema = z.object({
  attendeeId: z.string().min(1),
  status: z.enum(["PRESENT", "EXCUSED", "ABSENT"]),
});

/**
 * PATCH /api/meetings/[id]/attendance
 * Met à jour le statut d'émargement d'un participant (PRESENT, EXCUSED, ABSENT).
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateAttendanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { attendeeId, status } = parsed.data;

    // Vérifier que l'émargement appartient bien à cette réunion
    const attendee = await prisma.meetingAttendee.findFirst({
      where: { id: attendeeId, meetingId: id },
    });

    if (!attendee) {
      return NextResponse.json(
        { error: "Participant introuvable pour cette réunion" },
        { status: 404 }
      );
    }

    await prisma.meetingAttendee.update({
      where: { id: attendeeId },
      data: { status: status as AttendanceStatus },
    });

    const updated = await prisma.meetingAttendee.findUnique({
      where: { id: attendeeId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH attendance:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
