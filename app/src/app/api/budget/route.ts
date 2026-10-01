import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

/**
 * Schéma de validation pour la création d'une entrée budget.
 */
const budgetSchema = z.object({
  label: z.string().min(1, "Le libellé est obligatoire"),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive().optional(),
  deliveryCost: z.number().min(0).optional(),
  amount: z.number().positive("Le montant doit être positif"),
  date: z.string().datetime().or(z.date().transform((d) => d.toISOString())),
  category: z.enum(["SUPPLIES", "SERVICES", "SOFTWARE", "OTHER"]),
  comment: z.string().optional(),
  status: z.enum(["PLANNED", "VALIDATED", "PAID"]).default("PLANNED"),
});

/**
 * GET /api/budget — Récupère toutes les entrées budget avec pagination.
 * Paramètres query : page (défaut 1), limit (défaut 50).
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.budgetEntry.findMany({
        orderBy: { date: "desc" },
        include: { createdBy: { select: { name: true, email: true } } },
        skip,
        take: limit,
      }),
      prisma.budgetEntry.count(),
    ]);

    return NextResponse.json({
      data: entries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur GET /api/budget:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/budget — Crée une nouvelle entrée budget.
 * Accessible à tous les utilisateurs authentifiés.
 * Le plafond de financement du projet reste distinct des dépenses enregistrées.
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst();
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const newEntry = await prisma.budgetEntry.create({
      data: {
        label: parsed.data.label,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
        deliveryCost: parsed.data.deliveryCost,
        amount: parsed.data.amount,
        date: new Date(parsed.data.date),
        category: parsed.data.category,
        comment: parsed.data.comment,
        status: parsed.data.status,
        projectId: project.id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/budget:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
