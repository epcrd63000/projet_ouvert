import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications — Récupère les notifications de l'utilisateur.
 * Paramètres query : unreadOnly (booléen), page (défaut 1), limit (défaut 30).
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "30")));
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur GET /api/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
