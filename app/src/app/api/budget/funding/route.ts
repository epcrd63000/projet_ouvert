import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

const fundingSchema = z.object({
  name: z.string().min(1, "Le nom de l'enveloppe est obligatoire"),
  amount: z.number().positive("Le montant doit être supérieur à 0"),
  date: z.string().datetime().or(z.date().transform((d) => d.toISOString())),
  comment: z.string().optional(),
  status: z.enum(["RECEIVED", "PENDING", "CANCELLED"]).default("RECEIVED"),
});

/**
 * GET /api/budget/funding — Récupère toutes les enveloppes de financement du projet.
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const project = await prisma.project.findFirst();
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const sources = await prisma.fundingSource.findMany({
      where: { projectId: project.id },
      orderBy: { date: "asc" },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ data: sources });
  } catch (error) {
    console.error("Erreur GET /api/budget/funding:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/budget/funding — Crée une nouvelle source de financement ("qui se rajoute").
 * Accessible aux administrateurs.
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = fundingSchema.safeParse(body);

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

    const created = await prisma.fundingSource.create({
      data: {
        projectId: project.id,
        createdById: session.user.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        date: new Date(parsed.data.date),
        comment: parsed.data.comment || null,
        status: parsed.data.status,
      },
    });

    // Synchronisation automatique de project.totalBudget
    const activeSources = await prisma.fundingSource.findMany({
      where: { projectId: project.id, status: { not: "CANCELLED" } },
      select: { amount: true },
    });
    const newTotal = activeSources.reduce((acc, s) => acc + Number(s.amount), 0);
    await prisma.project.update({
      where: { id: project.id },
      data: { totalBudget: newTotal },
    });

    const fullCreated = await prisma.fundingSource.findUnique({
      where: { id: created.id },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(fullCreated, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/budget/funding:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
