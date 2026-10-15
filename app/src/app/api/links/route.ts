import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { normalizeUrl, fetchGoogleFavicon } from "@/components/links/linkUtils";

export const dynamic = "force-dynamic";

function jsonWithRequestId(
  body: unknown,
  status: number,
  requestId: string
): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("x-request-id", requestId);
  return response;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if ("cause" in error) return getErrorCode(error.cause);
  return undefined;
}

function getSafeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Non-Error exception";
  return error.message
    .replace(/\b(?:postgres(?:ql)?|https?):\/\/[^\s"'<>]+/gi, "[redacted-url]")
    .replace(
      /\b(password|passwd|pwd|token|secret|cookie)\s*[=:]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1=[redacted]"
    )
    .slice(0, 1000);
}

function logLinkCreationFailure(
  requestId: string,
  stage: string,
  error: unknown
): void {
  console.error("POST /api/links failed", {
    requestId,
    stage,
    errorName: error instanceof Error ? error.name : typeof error,
    errorCode: getErrorCode(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function getLinkCreationErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  switch (code) {
    case "P2002":
      return "Un lien avec ces informations existe déjà. Actualisez la page et réessayez.";
    case "P2003":
      return "Le projet ou le compte associé au lien est introuvable. Actualisez la page et réessayez.";
    case "P2021":
    case "P2022":
      return "La base de données n’est pas à jour avec cette version. Contactez l’administrateur pour synchroniser le schéma.";
    case "P2024":
      return "La base de données est temporairement indisponible. Réessayez dans quelques instants.";
    case "42P01":
      return "La table des liens est absente de la base de données. L’administrateur doit synchroniser le schéma.";
    case "42703":
      return "Le schéma de la base de données doit être synchronisé par l’administrateur.";
    case "23503":
      return "Le projet ou le compte associé au lien est introuvable. Actualisez la page et réessayez.";
    case "42501":
      return "La base de données refuse l’écriture du lien. L’administrateur doit vérifier les droits d’accès.";
  }

  if (error instanceof Error && error.name === "PrismaClientInitializationError") {
    return "Connexion à la base de données impossible. Réessayez dans quelques instants ou contactez l’administrateur.";
  }
  if (error instanceof Error && error.name === "PrismaClientValidationError") {
    return "Les données du lien ne sont pas acceptées par le schéma actuel. Contactez l’administrateur.";
  }

  return "Le serveur n’a pas pu enregistrer le lien. L’administrateur doit consulter les journaux du déploiement.";
}

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
  const requestId = randomUUID();
  let stage = "authentication";
  try {
    console.info("POST /api/links received", { requestId });
    const session = await requireAuth();
    if (!session?.user) {
      return jsonWithRequestId({ error: "Non autorisé" }, 401, requestId);
    }

    stage = "request_body";
    const body = await request.json();
    stage = "validation";
    const parsed = createLinkSchema.safeParse(body);

    if (!parsed.success) {
      console.warn("POST /api/links validation failed", {
        requestId,
        issues: parsed.error.issues.map(({ code, path }) => ({ code, path })),
      });
      return jsonWithRequestId(
        { error: parsed.error.errors[0].message },
        400,
        requestId
      );
    }

    const { title, url, category, description, imageUrl, isPinned, order } = parsed.data;
    const finalUrl = normalizeUrl(url);
    const finalImage = imageUrl?.trim() ? imageUrl.trim() : fetchGoogleFavicon(finalUrl);

    // On rattache automatiquement au projet singleton IMT si existant
    stage = "project_lookup";
    const project = await prisma.project.findFirst({ select: { id: true } });

    stage = "link_insert";
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

    console.info("POST /api/links succeeded", {
      requestId,
      hasProject: !!project,
      isPinned,
    });
    return jsonWithRequestId(newLink, 201, requestId);
  } catch (error) {
    logLinkCreationFailure(requestId, stage, error);
    return jsonWithRequestId(
      { error: getLinkCreationErrorMessage(error) },
      500,
      requestId
    );
  }
}
