import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateFundingSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Date invalide").optional(),
  comment: z.string().nullable().optional(),
  status: z.enum(["RECEIVED", "PENDING", "CANCELLED"]).optional(),
});

/**
 * PATCH /api/budget/funding/[id] — Modifie une source de financement ou son statut ("qui s'annule", commentaires).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateFundingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Seul un admin peut changer montant/statut/nom, mais les membres peuvent modifier ou ajouter un commentaire
    const isOnlyCommentUpdate =
      Object.keys(body).length === 1 && parsed.data.comment !== undefined;

    if (!isOnlyCommentUpdate && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    await prisma.fundingSource.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
        ...(parsed.data.date && { date: new Date(parsed.data.date) }),
        ...(parsed.data.comment !== undefined && { comment: parsed.data.comment }),
        ...(parsed.data.status && { status: parsed.data.status }),
      },
    });

    const updated = await prisma.fundingSource.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (updated) {
      const activeSources = await prisma.fundingSource.findMany({
        where: { projectId: updated.projectId, status: { not: "CANCELLED" } },
        select: { amount: true },
      });
      const newTotal = activeSources.reduce((acc, s) => acc + Number(s.amount), 0);
      await prisma.project.update({
        where: { id: updated.projectId },
        data: { totalBudget: newTotal },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/budget/funding/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/budget/funding/[id] — Supprime définitivement une source de financement.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const sourceToDelete = await prisma.fundingSource.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (sourceToDelete) {
      await prisma.fundingSource.delete({
        where: { id },
      });

      const activeSources = await prisma.fundingSource.findMany({
        where: { projectId: sourceToDelete.projectId, status: { not: "CANCELLED" } },
        select: { amount: true },
      });
      const newTotal = activeSources.reduce((acc, s) => acc + Number(s.amount), 0);
      await prisma.project.update({
        where: { id: sourceToDelete.projectId },
        data: { totalBudget: newTotal },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/budget/funding/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
