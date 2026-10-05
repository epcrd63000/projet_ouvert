import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string; decisionId: string }>;
}

const updateDecisionSchema = z.object({
  content: z.string().min(1).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

/**
 * DELETE /api/meetings/[id]/decisions/[decisionId]
 * Supprime une décision d'une réunion.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { decisionId } = await params;

  try {
    await prisma.meetingDecision.delete({
      where: { id: decisionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE decision:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/meetings/[id]/decisions/[decisionId]
 * Met à jour les champs d'une décision.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { decisionId } = await params;

  try {
    const body = await request.json();
    const parsed = updateDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
    if (parsed.data.assigneeId !== undefined) updateData.assigneeId = parsed.data.assigneeId;
    if (parsed.data.dueDate !== undefined) {
      updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }

    const updated = await prisma.meetingDecision.update({
      where: { id: decisionId },
      data: updateData,
    });

    // Synchronisation de la tâche Kanban liée si elle a déjà été créée
    if (updated.taskId) {
      const taskUpdate: Record<string, unknown> = {};
      if (parsed.data.content !== undefined) taskUpdate.title = parsed.data.content;
      if (parsed.data.dueDate !== undefined) {
        taskUpdate.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
      }
      if (Object.keys(taskUpdate).length > 0) {
        await prisma.task.update({
          where: { id: updated.taskId },
          data: taskUpdate,
        });
      }

      if (parsed.data.assigneeId !== undefined) {
        await prisma.taskAssignment.deleteMany({ where: { taskId: updated.taskId } });
        if (parsed.data.assigneeId) {
          await prisma.taskAssignment.create({
            data: { taskId: updated.taskId, userId: parsed.data.assigneeId },
          });
        }
      }
    }

    const fullDecision = await prisma.meetingDecision.findUnique({
      where: { id: decisionId },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, title: true, status: true, progress: true } },
      },
    });

    return NextResponse.json(fullDecision);
  } catch (error) {
    console.error("Erreur PATCH decision:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
