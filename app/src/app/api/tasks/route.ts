import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { createTaskSchema } from "@/lib/validations/task";
import { createNotification } from "@/lib/notifications";
import { getTaskListAssigneeId, resolveTaskAssignees } from "@/lib/task-assignment";

/**
 * GET /api/tasks — Récupère les tâches.
 * Paramètre query : userId (optionnel, ADMIN seulement) ou all=true (ADMIN seulement).
 * Les MEMBER ne voient que leurs tâches.
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("userId");
  const showAll = searchParams.get("all") === "true";

  try {
    // Requête de base avec relations
    const where: Record<string, unknown> = {};
    const assigneeId = getTaskListAssigneeId(
      session.user.role,
      session.user.id,
      requestedUserId,
      showAll
    );
    if (assigneeId) {
      where.assignments = { some: { userId: assigneeId } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        subTasks: { select: { id: true, title: true, status: true } },
      },
      orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Erreur GET /api/tasks:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/tasks — Crée une tâche pour soi, ou pour un autre utilisateur si l'appelant est ADMIN.
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { assigneeIds, assignmentMode, dueDate, ...taskData } = parsed.data;
    const assignment = resolveTaskAssignees(
      session.user.role,
      session.user.id,
      assignmentMode,
      assigneeIds
    );
    if ("error" in assignment && assignment.error === "forbidden") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent assigner une tâche à quelqu’un d’autre" },
        { status: 403 }
      );
    }

    if ("error" in assignment && assignment.error === "missing-assignee") {
      return NextResponse.json(
        { error: "Sélectionnez au moins une personne à assigner" },
        { status: 400 }
      );
    }

    if ("error" in assignment) {
      return NextResponse.json({ error: "Impossible de déterminer les assignés" }, { status: 400 });
    }
    const resolvedAssigneeIds = assignment.assigneeIds;

    // Récupérer le projet singleton
    const project = await prisma.project.findFirst();
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    // Calculer la position max dans la colonne
    const maxPosition = await prisma.task.aggregate({
      where: { status: taskData.status, projectId: project.id },
      _max: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        ...taskData,
        dueDate: dueDate ? new Date(dueDate) : null,
        position: (maxPosition._max.position ?? -1) + 1,
        projectId: project.id,
        createdById: session.user.id,
        assignments: {
          create: resolvedAssigneeIds.map((userId) => ({ userId })),
        },
      },
    });

    const taskWithRelations = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    // Envoyer une notification aux assignés
    for (const userId of resolvedAssigneeIds) {
      if (userId !== session.user.id) {
        await createNotification(
          userId,
          "TASK_ASSIGNED",
          "Nouvelle tâche assignée",
          `Vous avez été assigné à la tâche : ${task.title}`,
          task.id,
          "Task"
        );
      }
    }

    return NextResponse.json(taskWithRelations, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/tasks:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
