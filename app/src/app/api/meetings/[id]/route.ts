import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { updateMeetingSchema } from "@/lib/validations/meeting";
import { notifyUsers } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/meetings/[id] — Récupère une réunion par son ID.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        decisions: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
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
 * PATCH /api/meetings/[id] — Met à jour une réunion.
 * Les MEMBER ne peuvent modifier que le compte-rendu (notes).
 * Les ADMIN et le créateur peuvent tout modifier.
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
      if (
        attendeeIds !== undefined ||
        scheduledAt !== undefined ||
        meetingData.title !== undefined ||
        meetingData.status !== undefined
      ) {
        return NextResponse.json(
          { error: "Les membres ne peuvent modifier que le compte rendu." },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = { ...meetingData };
    if (scheduledAt) {
      updateData.scheduledAt = new Date(scheduledAt);
    }

    if (attendeeIds) {
      // Remplacer complètement les participants
      updateData.attendees = {
        deleteMany: {},
        create: attendeeIds.map((userId: string) => ({ userId })),
      };
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });

    // Si la date a changé, mettre à jour l'Event associé dans le calendrier
    if (scheduledAt) {
      await prisma.event.updateMany({
        where: { relatedMeetingId: id },
        data: {
          startAt: new Date(scheduledAt),
          endAt: new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json(updatedMeeting);
  } catch (error: unknown) {
    console.error("Erreur PATCH /api/meetings/[id]:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { error: "Réunion introuvable ou déjà supprimée" },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings/[id] — Supprime une réunion.
 * Accessible aux ADMIN et au créateur de la réunion.
 * Supprime en cascade : participants, décisions, Event calendrier.
 * Notifie tous les participants de l'annulation.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Récupérer la réunion avec les participants pour les permissions et les notifications
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { attendees: true },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });
    }

    // Vérifier les permissions : ADMIN ou créateur
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = meeting.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Collecter les IDs des participants pour notification
    const attendeeUserIds = meeting.attendees.map((a) => a.userId);

    // Supprimer l'Event calendrier associé
    await prisma.event.deleteMany({
      where: { relatedMeetingId: id },
    });

    // Supprimer la réunion (cascade : participants, décisions)
    await prisma.meeting.delete({ where: { id } });

    // Notifier les participants de l'annulation
    await notifyUsers(
      attendeeUserIds,
      "MEETING_CANCELLED",
      "Réunion annulée",
      `La réunion "${meeting.title}" a été annulée.`,
      undefined,
      undefined,
      session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/meetings/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
