import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateSecurePassword } from "@/lib/auth/credentialsLogic";

/**
 * Route API d'administration stricte réservée exclusivement à Étienne.
 * Permet de régénérer un mot de passe aléatoire pour un membre du projet.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Vérification stricte : rôle ADMIN et identité Étienne exclusivement
  const isEtienne =
    session.user.role === "ADMIN" &&
    (session.user.email?.toLowerCase().includes("etienne") ||
      session.user.name?.toLowerCase().includes("etienne"));

  if (!isEtienne) {
    return NextResponse.json(
      { error: "Accès interdit : cette fonctionnalité est strictement réservée à Étienne." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Identifiant utilisateur (userId) manquant ou invalide" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur cible introuvable" },
        { status: 404 }
      );
    }

    // Génération d'un nouveau mot de passe aléatoire robuste
    const newTempPassword = generateSecurePassword(10);
    const newPasswordHash = await bcrypt.hash(newTempPassword, 10);

    // Mise à jour synchrone en base Neon
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        tempPassword: newTempPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        tempPassword: true,
      },
    });

    console.log(`[admin] 🔑 Mot de passe réinitialisé pour ${updated.name} par Étienne.`);

    return NextResponse.json({
      success: true,
      userId: updated.id,
      newPassword: newTempPassword,
    });
  } catch (error) {
    console.error("[admin] Erreur lors de la réinitialisation du mot de passe :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la réinitialisation du mot de passe" },
      { status: 500 }
    );
  }
}
