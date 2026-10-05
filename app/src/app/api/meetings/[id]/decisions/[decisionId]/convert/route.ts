import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { convertDecisionToTask } from "@/lib/meetings/decisionService";

interface RouteParams {
  params: Promise<{ id: string; decisionId: string }>;
}

/**
 * POST /api/meetings/[id]/decisions/[decisionId]/convert
 * Convertit une décision de réunion en tâche Kanban dans le projet.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { decisionId } = await params;

  try {
    const result = await convertDecisionToTask(decisionId, session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur conversion décision -> tâche:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Erreur serveur lors de la conversion" },
      { status: 500 }
    );
  }
}
