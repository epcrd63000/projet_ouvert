import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/permissions";
import { updateMilestoneSchema } from "@/lib/validations/milestone";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/milestones/[id] — Récupère les détails d'un jalon.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const milestone = await prisma.ganttMilestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Jalon introuvable" }, { status: 404 });
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Erreur GET /api/milestones/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/milestones/[id] — Met à jour un jalon Gantt.
 * Accessible à tous les membres.
 * Synchronise les dates et le nom avec l'événement calendrier lié.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateMilestoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { startDate, endDate, name, color, ...otherFields } = parsed.data;

    const updatedMilestone = await prisma.ganttMilestone.update({
      where: { id },
      data: {
        ...otherFields,
        ...(name ? { name } : {}),
        ...(color ? { color } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
      },
    });

    // Mettre à jour l'événement calendrier synchronisé si nécessaire (mode Neon HTTP compatible)
    if (startDate || endDate || name || color) {
      const milestoneEvents = await prisma.event.findMany({
        where: { relatedMilestoneId: id },
        select: { id: true },
      });
      for (const ev of milestoneEvents) {
        await prisma.event.update({
          where: { id: ev.id },
          data: {
            ...(name ? { title: `Jalon: ${name}` } : {}),
            ...(color ? { color } : {}),
            ...(startDate ? { startAt: new Date(startDate) } : {}),
            ...(endDate ? { endAt: new Date(endDate) } : {}),
          },
        });
      }
    }

    return NextResponse.json(updatedMilestone);
  } catch (error) {
    console.error("Erreur PATCH /api/milestones/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/milestones/[id] — Supprime un jalon Gantt.
 * Réservé exclusivement aux administrateurs (ADMIN).
 * Supprime également l'événement calendrier lié.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const milestone = await prisma.ganttMilestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Jalon introuvable" }, { status: 404 });
    }

    // Supprimer l'événement calendrier synchronisé
    await prisma.event.deleteMany({
      where: { relatedMilestoneId: id },
    });

    // Supprimer le jalon Gantt
    await prisma.ganttMilestone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/milestones/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
