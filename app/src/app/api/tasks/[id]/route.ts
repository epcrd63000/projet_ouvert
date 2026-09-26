import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/permissions";
import { updateTaskSchema } from "@/lib/validations/task";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/tasks/[id] — Met à jour une tâche.
 * Les MEMBER peuvent modifier le statut et la position de leurs tâches.
 * Les ADMIN peuvent tout modifier.
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

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateFields,
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(parentId !== undefined
          ? parentId
            ? { parent: { connect: { id: parentId } } }
            : { parent: { disconnect: true } }
          : {}),
      },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Erreur PATCH /api/tasks/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id] — Supprime une tâche (ADMIN uniquement).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Accès réservé aux Admin" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/tasks/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
