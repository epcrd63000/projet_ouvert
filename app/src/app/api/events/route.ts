import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  try {
    const meetings = await prisma.meeting.findMany({
      include: { attendees: { include: { user: { select: { id: true, name: true } } } } },
    });

    const tasks = await prisma.task.findMany({
      where: { 
        dueDate: { not: null },
        ...(isAdmin ? {} : { assignments: { some: { userId: userId } } })
      },
      include: { assignments: { include: { user: { select: { id: true, name: true } } } } },
    });

    const manualEvents = await prisma.event.findMany({
      where: { 
        type: "MANUAL",
        OR: [
          { visibility: "TEAM" },
          { createdById: userId }
        ]
      }
    });

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
        const isMine = t.assignments.some(a => a.userId === userId);
        const assignees = t.assignments.map(a => a.user.name).join(", ");
        const titleSuffix = (!isMine && assignees) ? ` (${assignees})` : "";
        return {
          id: `task-${t.id}`,
          title: `Tâche: ${t.title}${titleSuffix}`,
          start: t.dueDate,
          end: t.dueDate,
          type: "task",
          status: t.status,
          originalId: t.id,
          allDay: true,
          isMine: isMine, // custom property to style differently
        };
      }),
      ...manualEvents.map((e) => ({
        id: `event-${e.id}`,
        title: e.title,
        start: e.startAt,
        end: e.endAt,
        type: "manual",
        status: "PLANNED",
        originalId: e.id,
        allDay: e.allDay,
      }))
    ];

    return NextResponse.json(events);
  } catch (error) {
    console.error("Erreur GET /api/events:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, startAt, endAt, allDay } = body;

    const project = await prisma.project.findFirst();
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        allDay: allDay || false,
        type: "MANUAL",
        projectId: project.id,
        createdById: session.user.id,
      }
    });
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/events:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
