import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { updateMeetingSchema } from "@/lib/validations/meeting";
import { notifyUsers } from "@/lib/notifications";
import { syncMeetingPreparationTask, deleteMeetingPreparationTask } from "@/lib/meetings/agendaService";
import { computeAttendeeDiff, buildCalendarEventSyncData } from "@/lib/meetings/meetingEditService";

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
          orderBy: { user: { name: "asc" } },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        decisions: {
          include: {
            createdBy: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
            task: { select: { id: true, title: true, status: true, progress: true } },
          },
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
 * Accès collaboratif ouvert : tous les membres de l'équipe peuvent éditer
 * les objectifs, le compte rendu, le statut et les notes.
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

    const updateData: Record<string, unknown> = { ...meetingData };
    if (scheduledAt) {
      updateData.scheduledAt = new Date(scheduledAt);
    }

    if (attendeeIds) {
      // Récupérer les participants existants pour conserver leurs statuts d'émargement
      const existingAttendees = await prisma.meetingAttendee.findMany({
        where: { meetingId: id }
      });
      
      const existingUserIds = existingAttendees.map(a => a.userId);
      const { toAdd, toDelete } = computeAttendeeDiff(existingUserIds, attendeeIds);

      if (toDelete.length > 0) {
        await prisma.meetingAttendee.deleteMany({
          where: { meetingId: id, userId: { in: toDelete } }
        });
      }

      for (const userId of toAdd) {
        await prisma.meetingAttendee.create({
          data: { meetingId: id, userId, status: "PRESENT" },
        });
      }
    }

    await prisma.meeting.update({
      where: { id },
      data: updateData,
    });

    const updatedMeeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });

    // Mettre à jour l'Event associé dans le calendrier (date, titre, notes)
    // Utilisation d'une boucle update unitaire pour compatibilité totale Neon HTTP (pas de transaction)
    const eventUpdateData = buildCalendarEventSyncData({
      title: meetingData.title,
      scheduledAt,
      notes: meetingData.notes,
    });
    if (Object.keys(eventUpdateData).length > 0) {
      const relatedEvents = await prisma.event.findMany({
        where: { relatedMeetingId: id },
        select: { id: true },
      });
      for (const event of relatedEvents) {
        await prisma.event.update({
          where: { id: event.id },
          data: eventUpdateData,
        });
      }
    }

    // Gestion du cycle de vie de la tâche Kanban collective
    if (updatedMeeting) {
      if (updatedMeeting.status === "DONE") {
        await deleteMeetingPreparationTask(id);
      } else {
        const attendeeUserIds = updatedMeeting.attendees.map((a) => a.userId);
        await syncMeetingPreparationTask({
          meetingId: id,
          projectId: updatedMeeting.projectId,
          title: updatedMeeting.title,
          scheduledAt: updatedMeeting.scheduledAt,
          attendeeIds: attendeeUserIds,
        });
      }
    }

    // Révalidation instantanée du cache de routage Next.js
    revalidatePath("/meetings");
    revalidatePath(`/meetings/${id}`);
    revalidatePath("/agenda");
    revalidatePath("/kanban");
    revalidatePath("/dashboard");

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

    // Supprimer la tâche Kanban de préparation associée
    await deleteMeetingPreparationTask(id);

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
