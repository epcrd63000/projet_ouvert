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

    // Les MEMBER ne peuvent modifier que le statut et la position de leurs propres tâches
    if (session.user.role !== "ADMIN") {
      const isAssigned = existingTask.assignments.some(
        (a) => a.userId === session.user.id
      );
      if (!isAssigned) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }

      // Restreindre les champs modifiables pour les MEMBER
      const allowedFields = ["status", "position"];
      const requestedFields = Object.keys(parsed.data);
      const forbidden = requestedFields.filter((f) => !allowedFields.includes(f));
      if (forbidden.length > 0) {
        return NextResponse.json(
          { error: `Champs non autorisés : ${forbidden.join(", ")}` },
          { status: 403 }
        );
      }
    }

    const { dueDate, parentId, ...updateFields } = parsed.data;

    // Détecter si le statut passe à DONE
    const isCompletingTask =
      parsed.data.status === "DONE" && existingTask.status !== "DONE";

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateFields,
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
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

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
        session.user.id
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
 * Accessible aux ADMIN et aux membres assignés à la tâche.
 * Supprime en cascade les sous-tâches et les assignations.
 * Notifie tous les assignés de la suppression.
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

    // Vérifier les permissions : ADMIN ou membre assigné
    const isAdmin = session.user.role === "ADMIN";
    const isAssigned = task.assignments.some(
      (a) => a.userId === session.user.id
    );

    if (!isAdmin && !isAssigned) {
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
