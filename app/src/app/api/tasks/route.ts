import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/permissions";
import { createTaskSchema } from "@/lib/validations/task";
import { createNotification } from "@/lib/notifications";

/**
 * GET /api/tasks — Récupère les tâches.
 * Paramètres query : userId (optionnel), projectId (optionnel).
 * Les MEMBER ne voient que leurs tâches, les ADMIN voient tout.
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const showAll = searchParams.get("all") === "true";

  try {
    // Requête de base avec relations
    const where: Record<string, unknown> = {};

    // Si showAll n'est pas activé, restreindre strictement aux tâches assignées à l'utilisateur ciblé ou courant
    if (!showAll) {
      const targetUserId = userId || session.user.id;
      where.assignments = { some: { userId: targetUserId } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
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
 * POST /api/tasks — Crée une nouvelle tâche (ADMIN pour tout le monde, MEMBER pour lui-même).
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

    let { assigneeIds, dueDate, ...taskData } = parsed.data;

    // Résoudre les assignés : les MEMBER ne peuvent s'assigner qu'à eux-mêmes, les ADMIN peuvent assigner à tous
    const validAssigneeIds =
      session.user.role === "ADMIN"
        ? assigneeIds && assigneeIds.length > 0
          ? Array.from(new Set(assigneeIds.filter(Boolean)))
          : [session.user.id]
        : [session.user.id];

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
      },
    });

    if (validAssigneeIds.length > 0) {
      await prisma.taskAssignment.createMany({
        data: validAssigneeIds.map((userId: string) => ({
          taskId: task.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    const taskWithRelations = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Envoyer une notification aux assignés
    for (const userId of validAssigneeIds) {
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
