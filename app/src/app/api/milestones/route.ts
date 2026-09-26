import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

/**
 * GET /api/milestones — Récupère les jalons Gantt.
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const milestones = await prisma.ganttMilestone.findMany({
      orderBy: [{ startDate: "asc" }],
    });
    return NextResponse.json(milestones);
  } catch (error) {
    console.error("Erreur GET /api/milestones:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
