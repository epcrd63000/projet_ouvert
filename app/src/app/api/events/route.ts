import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

/**
 * GET /api/events — Récupère les réunions et tâches pour l'agenda.
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // 1. Récupérer les réunions
    const meetings = await prisma.meeting.findMany({
      include: {
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // 2. Récupérer les tâches avec une dueDate
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null },
      },
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // 3. Formater pour react-big-calendar ou un autre calendrier
    const events = [
      ...meetings.map((m) => ({
        id: `meeting-${m.id}`,
        title: `Réunion: ${m.title}`,
        start: m.scheduledAt,
        end: new Date(new Date(m.scheduledAt).getTime() + 60 * 60 * 1000), // +1h par défaut
        type: "meeting",
        status: m.status,
        originalId: m.id,
      })),
      ...tasks.map((t) => ({
        id: `task-${t.id}`,
        title: `Tâche: ${t.title}`,
        start: t.dueDate,
        end: t.dueDate,
        type: "task",
        status: t.status,
        originalId: t.id,
        allDay: true,
      })),
    ];

    return NextResponse.json(events);
  } catch (error) {
    console.error("Erreur GET /api/events:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
