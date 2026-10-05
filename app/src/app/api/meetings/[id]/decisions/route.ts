import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const createDecisionSchema = z.object({
  content: z.string().min(1, "Le libellé de la décision est obligatoire"),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

/**
 * GET /api/meetings/[id]/decisions
 * Liste toutes les décisions d'une réunion.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const decisions = await prisma.meetingDecision.findMany({
      where: { meetingId: id },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, title: true, status: true, progress: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Erreur GET /api/meetings/[id]/decisions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/meetings/[id]/decisions
 * Crée une nouvelle décision dans la réunion.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = createDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, assigneeId, dueDate } = parsed.data;

    const decision = await prisma.meetingDecision.create({
      data: {
        meetingId: id,
        content,
        createdById: session.user.id,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    const fullDecision = await prisma.meetingDecision.findUnique({
      where: { id: decision.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, title: true, status: true, progress: true } },
      },
    });

    return NextResponse.json(fullDecision, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/meetings/[id]/decisions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
