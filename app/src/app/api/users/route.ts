import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

/**
 * GET /api/users — Récupère la liste des utilisateurs du projet.
 * Utilisé pour la sélection d'assignés dans les formulaires.
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erreur GET /api/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
