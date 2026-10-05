import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { createMeetingSchema } from "@/lib/validations/meeting";
import { notifyUsers } from "@/lib/notifications";

/**
 * GET /api/meetings — Récupère les réunions.
 * Tous les membres peuvent voir les réunions.
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ scheduledAt: "asc" }],
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Erreur GET /api/meetings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/meetings — Crée une nouvelle réunion.
 * Accessible à tous les utilisateurs authentifiés.
 * Crée automatiquement un Event calendrier de type MEETING.
 * Notifie tous les participants ajoutés.
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createMeetingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { attendeeIds, scheduledAt, ...meetingData } = parsed.data;

    // Récupérer le projet singleton
    const project = await prisma.project.findFirst();
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        ...meetingData,
        scheduledAt: new Date(scheduledAt),
        projectId: project.id,
        createdById: session.user.id,
      },
    });

    for (const userId of attendeeIds) {
      await prisma.meetingAttendee.create({
        data: { meetingId: meeting.id, userId, status: "PRESENT" },
      });
    }

    // Création automatique de l'Event calendrier associé
    await prisma.event.create({
      data: {
        projectId: project.id,
        createdById: session.user.id,
        relatedMeetingId: meeting.id,
        title: meetingData.title,
        description: meetingData.notes || undefined,
        startAt: new Date(scheduledAt),
        endAt: new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000),
        type: "MEETING",
      },
    });

    const fullMeeting = await prisma.meeting.findUnique({
      where: { id: meeting.id },
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });

    // Notifier les participants de la nouvelle réunion
    if (attendeeIds.length > 0) {
      await notifyUsers(
        attendeeIds,
        "MEETING_SCHEDULED",
        "Nouvelle réunion planifiée",
        `Vous avez été invité à la réunion : ${meetingData.title}`,
        meeting.id,
        "Meeting",
        session.user.id
      );
    }

    revalidatePath("/meetings");

    return NextResponse.json(fullMeeting, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/meetings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

