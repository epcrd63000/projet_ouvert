import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { normalizeUrl, fetchGoogleFavicon } from "@/components/links/linkUtils";

export const dynamic = "force-dynamic";

const createLinkSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  url: z
    .string()
    .trim()
    .min(1, "L'URL est requise")
    .refine((value) => {
      try {
        const parsedUrl = new URL(normalizeUrl(value));
        return (
          (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
          !!parsedUrl.hostname
        );
      } catch {
        return false;
      }
    }, "Saisissez une URL valide (http:// ou https://)."),
  category: z.string().optional().default("Général"),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isPinned: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
});

/**
 * Récupère l'ensemble des liens du projet.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const links = await prisma.projectLink.findMany({
      orderBy: [
        { isPinned: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("Erreur GET /api/links:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Crée un nouveau lien dans la base de données.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, url, category, description, imageUrl, isPinned, order } = parsed.data;
    const finalUrl = normalizeUrl(url);
    const finalImage = imageUrl?.trim() ? imageUrl.trim() : fetchGoogleFavicon(finalUrl);

    // On rattache automatiquement au projet singleton IMT si existant
    const project = await prisma.project.findFirst({ select: { id: true } });

    const newLink = await prisma.projectLink.create({
      data: {
        title: title.trim(),
        url: finalUrl,
        category: category?.trim() || "Général",
        description: description?.trim() || null,
        imageUrl: finalImage || null,
        isPinned,
        order,
        projectId: project?.id || null,
        createdById: session.user.id || null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/links:", error);
    return NextResponse.json({ error: "Erreur lors de la création du lien" }, { status: 500 });
  }
}
