import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Schéma de validation pour la mise à jour d'une entrée budget.
 */
const updateBudgetSchema = z.object({
  label: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().positive().optional(),
  deliveryCost: z.number().min(0).optional(),
  amount: z.number().positive().optional(),
  date: z.string().datetime().or(z.date().transform((d) => d.toISOString())).optional(),
  category: z.enum(["SUPPLIES", "SERVICES", "SOFTWARE", "OTHER"]).optional(),
  comment: z.string().optional(),
  status: z.enum(["PLANNED", "VALIDATED", "PAID"]).optional(),
});

/**
 * PATCH /api/budget/[id] — Met à jour une entrée budget.
 * Accessible à tous les utilisateurs authentifiés.
 * Le plafond de financement du projet reste distinct des dépenses enregistrées.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.budgetEntry.update({
      where: { id },
      data: {
        ...(parsed.data.label && { label: parsed.data.label }),
        ...(parsed.data.quantity !== undefined && { quantity: parsed.data.quantity }),
        ...(parsed.data.unitPrice !== undefined && { unitPrice: parsed.data.unitPrice }),
        ...(parsed.data.deliveryCost !== undefined && { deliveryCost: parsed.data.deliveryCost }),
        ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
        ...(parsed.data.date && { date: new Date(parsed.data.date) }),
        ...(parsed.data.category && { category: parsed.data.category }),
        ...(parsed.data.comment !== undefined && { comment: parsed.data.comment }),
        ...(parsed.data.status && { status: parsed.data.status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/budget/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/budget/[id] — Supprime une entrée budget.
 * Accessible à tous les utilisateurs authentifiés.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.budgetEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/budget/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
