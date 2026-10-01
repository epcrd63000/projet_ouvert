import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

/**
 * PATCH /api/notifications/read-all — Marque toutes les notifications comme lues.
 */
export async function PATCH() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const result = await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Erreur PATCH /api/notifications/read-all:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
