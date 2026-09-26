import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/permissions";
import { createMeetingSchema } from "@/lib/validations/meeting";

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
 * POST /api/meetings — Crée une nouvelle réunion (ADMIN uniquement).
 */
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Accès réservé aux Admin" }, { status: 403 });
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
        attendees: {
          create: attendeeIds.map((userId) => ({ userId })),
        },
        events: {
          create: {
            projectId: project.id,
            createdById: session.user.id,
            title: meetingData.title,
            description: meetingData.notes || undefined,
            startAt: new Date(scheduledAt),
            endAt: new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000), // Default 1 hour
            type: "MEETING"
          }
        }
      },
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/meetings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
