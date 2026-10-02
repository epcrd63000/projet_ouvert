import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { createEventSchema } from "@/lib/validations/event";

/**
 * GET /api/events — Récupère les événements du calendrier.
 * Paramètres query : start, end (filtres de date ISO 8601).
 * Fusionne réunions, tâches avec dueDate, événements manuels et jalons.
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;
  const { searchParams } = new URL(request.url);

  // Filtres de date optionnels pour limiter le volume
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const dateFilter = {
    ...(startParam ? { gte: new Date(startParam) } : {}),
    ...(endParam ? { lte: new Date(endParam) } : {}),
  };
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  try {
    // 1. Récupérer les réunions (avec filtre de date optionnel)
    const meetings = await prisma.meeting.findMany({
      where: hasDateFilter ? { scheduledAt: dateFilter } : undefined,
      include: {
        attendees: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // 2. Récupérer les tâches avec dueDate
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null, ...(hasDateFilter ? dateFilter : {}) },
        ...(isAdmin
          ? {}
          : {
              OR: [
                { assignments: { some: { userId } } },
                { createdById: userId },
              ],
            }),
      },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // 3. Récupérer les événements manuels et de jalons
    const dbEvents = await prisma.event.findMany({
      where: {
        ...(hasDateFilter ? { startAt: dateFilter } : {}),
        OR: [
          { type: "MILESTONE" },
          { type: "MANUAL", visibility: "TEAM" },
          { type: "MANUAL", createdById: userId },
        ],
      },
    });

    // 4. Fusionner les résultats au format attendu par le calendrier
    const events = [
      ...meetings.map((m) => ({
        id: `meeting-${m.id}`,
        title: `Réunion: ${m.title}`,
        start: m.scheduledAt,
        end: new Date(new Date(m.scheduledAt).getTime() + 60 * 60 * 1000),
        type: "meeting",
        status: m.status,
        originalId: m.id,
      })),
      ...tasks.map((t) => {
        const isMine = t.assignments.some((a) => a.userId === userId);
        const assignees = t.assignments.map((a) => a.user.name).join(", ");
        const titleSuffix = !isMine && assignees ? ` (${assignees})` : "";
        return {
          id: `task-${t.id}`,
          title: `Tâche: ${t.title}${titleSuffix}`,
          start: t.dueDate,
          end: t.dueDate,
          type: "task",
          status: t.status,
          originalId: t.id,
          allDay: true,
          isMine,
        };
      }),
      ...dbEvents.map((e) => ({
        id: `event-${e.id}`,
        title: e.title,
        start: e.startAt,
        end: e.endAt,
        type: e.type === "MILESTONE" ? "milestone" : "manual",
        status: "PLANNED",
        originalId: e.id,
        allDay: e.allDay,
        color: e.color,
      })),
    ];

    return NextResponse.json(events);
  } catch (error) {
    console.error("Erreur GET /api/events:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/events — Crée un événement manuel dans le calendrier.
 * Validation Zod obligatoire.
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst();
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const newEvent = await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        startAt: new Date(parsed.data.startAt),
        endAt: new Date(parsed.data.endAt),
        allDay: parsed.data.allDay,
        visibility: parsed.data.visibility,
        type: "MANUAL",
        projectId: project.id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/events:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
