import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { updateMeetingSchema } from "@/lib/validations/meeting";

/**
 * GET /api/meetings/[id] — Récupère une réunion.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Erreur GET /api/meetings/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/meetings/[id] — Met à jour une réunion (ex: ajouter le compte rendu).
 * Tous les membres peuvent éditer la réunion pour y ajouter le compte-rendu textuel (champ notes).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateMeetingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { attendeeIds, scheduledAt, ...meetingData } = parsed.data;

    const isAdmin = session.user.role === "ADMIN";
    
    // Si on n'est pas Admin, on ne peut modifier que "notes"
    if (!isAdmin) {
      if (attendeeIds !== undefined || scheduledAt !== undefined || meetingData.title !== undefined || meetingData.status !== undefined) {
        return NextResponse.json({ error: "Les membres ne peuvent modifier que le compte rendu." }, { status: 403 });
      }
    }

    const updateData: any = { ...meetingData };
    if (scheduledAt) {
      updateData.scheduledAt = new Date(scheduledAt);
    }

    if (attendeeIds) {
      // Pour remplacer complètement les attendees :
      updateData.attendees = {
        deleteMany: {},
        create: attendeeIds.map((userId) => ({ userId })),
      };
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: updateData,
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });

    return NextResponse.json(updatedMeeting);
  } catch (error: any) {
    console.error("Erreur PATCH /api/meetings/[id]:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Réunion introuvable ou déjà supprimée" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings/[id] — Supprime une réunion.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    await prisma.meeting.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erreur DELETE /api/meetings/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
