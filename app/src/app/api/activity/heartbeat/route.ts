import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Route API pour enregistrer le battement d'activité (visite active) de l'utilisateur connecté.
 * Limite à 1 enregistrement de visite par utilisateur par jour UTC pour optimiser le stockage.
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Début de la journée UTC en cours
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

    // Vérifie si une visite a déjà été comptabilisée aujourd'hui pour cet utilisateur
    const existingVisit = await prisma.userActivityLog.findFirst({
      where: {
        userId,
        actionType: "VISIT",
        createdAt: { gte: startOfDay },
      },
    });

    if (!existingVisit) {
      await prisma.userActivityLog.create({
        data: {
          userId,
          actionType: "VISIT",
          details: "Visite de session active",
          createdAt: now,
        },
      });
      return NextResponse.json({ logged: true, message: "Visite enregistrée" });
    }

    return NextResponse.json({ logged: false, message: "Visite déjà comptabilisée aujourd'hui" });
  } catch (error: any) {
    console.error("[heartbeat] Erreur d'enregistrement d'activité :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
