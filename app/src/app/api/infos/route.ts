import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const infoSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
  category: z.string().optional().default("GENERAL"),
  eventDate: z.string().nullable().optional(),
  interlocutors: z.string().nullable().optional(),
  isPinned: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
});

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const infos = await prisma.importantInfo.findMany({
      orderBy: [
        { isPinned: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(infos);
  } catch (error) {
    console.error("Erreur GET /api/infos:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = infoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { eventDate, ...rest } = parsed.data;

    const info = await prisma.importantInfo.create({
      data: {
        ...rest,
        eventDate: eventDate ? new Date(eventDate) : null,
      },
    });

    return NextResponse.json(info, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/infos:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
