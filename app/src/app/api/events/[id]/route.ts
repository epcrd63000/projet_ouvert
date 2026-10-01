import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  visibility: z.enum(["PERSONAL", "TEAM"]).optional(),
});

/**
 * GET /api/events/[id] — Récupère les détails d'un événement.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Erreur GET /api/events/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/events/[id] — Modifie un événement manuel.
 * Seuls les événements manuels sont modifiables directement.
 * Accessible au créateur ou aux ADMIN.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }

    if (event.type !== "MANUAL") {
      return NextResponse.json(
        { error: "Les événements liés aux réunions ou jalons doivent être modifiés depuis leur module respectif." },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const isCreator = event.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.startAt ? { startAt: new Date(parsed.data.startAt) } : {}),
        ...(parsed.data.endAt ? { endAt: new Date(parsed.data.endAt) } : {}),
        ...(parsed.data.allDay !== undefined ? { allDay: parsed.data.allDay } : {}),
        ...(parsed.data.visibility ? { visibility: parsed.data.visibility } : {}),
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Erreur PATCH /api/events/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[id] — Supprime un événement manuel.
 * Seuls les événements manuels peuvent être supprimés directement.
 * Accessible au créateur ou aux ADMIN.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }

    if (event.type !== "MANUAL") {
      return NextResponse.json(
        { error: "Les événements liés aux réunions ou jalons doivent être supprimés depuis leur module respectif." },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const isCreator = event.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/events/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
