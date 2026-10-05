import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * GET /api/prompts/[id]
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await Promise.resolve(context.params);
    const prompt = await prisma.aiPrompt.findUnique({
      where: { id: params.id },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt introuvable" }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Erreur GET prompt:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/prompts/[id]
 * Met à jour le titre et le contenu d'un prompt existant.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const body = await request.json();
    const { title, content } = body;

    const updated = await prisma.aiPrompt.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH prompt:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/prompts/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    await prisma.aiPrompt.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erreur DELETE prompt:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
