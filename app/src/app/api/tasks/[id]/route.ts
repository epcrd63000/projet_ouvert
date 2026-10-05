import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { updateTaskSchema } from "@/lib/validations/task";
import { createNotification, notifyUsers } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/tasks/[id] — Met à jour une tâche.
 * Les MEMBER assignés peuvent modifier le statut et la position.
 * Les ADMIN peuvent tout modifier.
 * Déclenche TASK_COMPLETED si le statut passe à DONE.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Vérifier que la tâche existe
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    // Résolution robuste de l'identifiant utilisateur courant
    let currentUserId = session.user.id;
    if (!currentUserId && session.user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) {
        currentUserId = dbUser.id;
      }
    }

    // Les MEMBER ne peuvent modifier que leurs propres tâches ou tâches en commun
    if (session.user.role !== "ADMIN") {
      const isAssigned = Boolean(
        currentUserId && existingTask.assignments.some((a) => a.userId === currentUserId)
      );
      const isCreator = Boolean(currentUserId && existingTask.createdById === currentUserId);
      if (!isAssigned && !isCreator) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }

      // Restreindre les champs modifiables pour les MEMBER
      const allowedFields = [
        "title",
        "description",
        "dueDate",
        "priority",
        "tags",
        "status",
        "position",
        "progress",
        "delayReason",
        "workload",
        "deliverables",
        "validationCriteria",
        "validator",
        "assigneeIds",
      ];
      const requestedFields = Object.keys(parsed.data);
      const forbidden = requestedFields.filter((f) => !allowedFields.includes(f));
      if (forbidden.length > 0) {
        return NextResponse.json(
          { error: `Champs non autorisés : ${forbidden.join(", ")}` },
          { status: 403 }
        );
      }
    }

    const { dueDate, parentId, status, progress, assigneeIds, ...updateFields } = parsed.data;

    let resolvedStatus = status;
    let resolvedProgress = progress;

    // Synchronisation bi-directionnelle entre avancement (%) et statut Kanban
    if (resolvedProgress !== undefined) {
      if (resolvedProgress === 100 && !resolvedStatus) {
        resolvedStatus = "DONE";
      } else if (resolvedProgress === 0 && !resolvedStatus && existingTask.status === "DONE") {
        resolvedStatus = "TODO";
      } else if (
        resolvedProgress > 0 &&
        resolvedProgress < 100 &&
        (!resolvedStatus || resolvedStatus === "TODO")
      ) {
        resolvedStatus = "IN_PROGRESS";
      }
    } else if (resolvedStatus !== undefined) {
      if (resolvedStatus === "DONE" && existingTask.progress < 100) {
        resolvedProgress = 100;
      } else if (resolvedStatus === "TODO" && existingTask.progress === 100) {
        resolvedProgress = 0;
      }
    }

    // Détecter si le statut passe à DONE
    const isCompletingTask =
      resolvedStatus === "DONE" && existingTask.status !== "DONE";

    await prisma.task.update({
      where: { id },
      data: {
        ...updateFields,
        ...(resolvedStatus !== undefined ? { status: resolvedStatus } : {}),
        ...(resolvedProgress !== undefined ? { progress: resolvedProgress } : {}),
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? new Date(dueDate) : null }
          : {}),
        ...(parentId !== undefined
          ? parentId
            ? { parent: { connect: { id: parentId } } }
            : { parent: { disconnect: true } }
          : {}),
        // Remplir completedAt automatiquement quand la tâche passe à DONE
        ...(isCompletingTask ? { completedAt: new Date() } : {}),
      },
    });

    // Mise à jour des assignations si fourni
    if (assigneeIds !== undefined) {
      const validAssignees = Array.from(new Set(assigneeIds.filter(Boolean)));
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      });
      if (validAssignees.length > 0) {
        await prisma.taskAssignment.createMany({
          data: validAssignees.map((uId: string) => ({
            taskId: id,
            userId: uId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const task = await prisma.task.findUnique({
      where: { id },
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

    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    // Notification TASK_COMPLETED aux assignés + créateur
    if (isCompletingTask) {
      const recipientIds = [
        ...task.assignments.map((a) => a.userId),
        ...(existingTask.createdById ? [existingTask.createdById] : []),
      ];
      const uniqueRecipients = Array.from(new Set(recipientIds));
      await notifyUsers(
        uniqueRecipients,
        "TASK_COMPLETED",
        "Tâche terminée",
        `La tâche "${task.title}" a été marquée comme terminée.`,
        task.id,
        "Task",
        currentUserId || session.user.id
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Erreur PATCH /api/tasks/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id] — Supprime une tâche.
 * Accessible aux ADMIN et aux membres assignés à la tâche ou créateurs.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Récupérer la tâche avec ses assignations pour vérifier les permissions
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: true,
        subTasks: { include: { assignments: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    let currentUserId = session.user.id;
    if (!currentUserId && session.user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) {
        currentUserId = dbUser.id;
      }
    }

    // Vérifier les permissions : ADMIN, créateur ou membre assigné
    const isAdmin = session.user.role === "ADMIN";
    const isAssigned = Boolean(
      currentUserId && task.assignments.some((a) => a.userId === currentUserId)
    );
    const isCreator = Boolean(currentUserId && task.createdById === currentUserId);

    if (!isAdmin && !isAssigned && !isCreator) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Collecter tous les utilisateurs assignés (tâche + sous-tâches) pour notification
    const allAssignedUserIds = [
      ...task.assignments.map((a) => a.userId),
      ...task.subTasks.flatMap((st) => st.assignments.map((a) => a.userId)),
    ];
    const uniqueAssignedIds = Array.from(new Set(allAssignedUserIds));

    // Supprimer la tâche (cascade : sous-tâches + assignations)
    await prisma.task.delete({ where: { id } });

    // Notifier les anciens assignés
    await notifyUsers(
      uniqueAssignedIds,
      "TASK_DELETED",
      "Tâche supprimée",
      `La tâche "${task.title}" a été supprimée.`,
      undefined,
      undefined,
      session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/tasks/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
