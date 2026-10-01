import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { createMilestoneSchema } from "@/lib/validations/milestone";

/**
 * GET /api/milestones — Récupère la liste des jalons Gantt.
 * Accessible à tous les membres authentifiés.
 */
export async function GET() {
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

/**
 * POST /api/milestones — Crée un nouveau jalon Gantt.
 * Accessible à tous les membres authentifiés.
 * Crée automatiquement un événement associé de type MILESTONE dans le calendrier.
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createMilestoneSchema.safeParse(body);

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

    const { name, description, startDate, endDate, color, status } = parsed.data;

    // Création du jalon et de son événement calendrier lié
    const milestone = await prisma.ganttMilestone.create({
      data: {
        projectId: project.id,
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        color,
        status,
        events: {
          create: {
            projectId: project.id,
            createdById: session.user.id,
            title: `Jalon: ${name}`,
            description: description || undefined,
            startAt: new Date(startDate),
            endAt: new Date(endDate),
            allDay: true,
            color,
            type: "MILESTONE",
          },
        },
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/milestones:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
