import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { normalizeUrl, fetchGoogleFavicon } from "@/components/links/linkUtils";

export const dynamic = "force-dynamic";

const updateLinkSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  order: z.number().int().optional(),
});

/**
 * Met à jour un lien existant.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {};
    if (parsed.data.title !== undefined) dataToUpdate.title = parsed.data.title.trim();
    if (parsed.data.url !== undefined) {
      const normalized = normalizeUrl(parsed.data.url);
      dataToUpdate.url = normalized;
      if (parsed.data.imageUrl === undefined) {
        dataToUpdate.imageUrl = fetchGoogleFavicon(normalized);
      }
    }
    if (parsed.data.category !== undefined) dataToUpdate.category = parsed.data.category.trim();
    if (parsed.data.description !== undefined) dataToUpdate.description = parsed.data.description?.trim() || null;
    if (parsed.data.imageUrl !== undefined) dataToUpdate.imageUrl = parsed.data.imageUrl?.trim() || null;
    if (parsed.data.isPinned !== undefined) dataToUpdate.isPinned = parsed.data.isPinned;
    if (parsed.data.order !== undefined) dataToUpdate.order = parsed.data.order;

    const updated = await prisma.projectLink.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/links/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Supprime un lien du projet.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await prisma.projectLink.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/links/[id]:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
