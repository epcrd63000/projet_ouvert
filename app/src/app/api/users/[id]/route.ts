import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/permissions";
import { updateUserSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id] — Récupère les détails d'un profil utilisateur.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        reminderHoursBefore: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur GET /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[id] — Met à jour le profil d'un utilisateur.
 * Les utilisateurs peuvent modifier leur propre nom, mot de passe, avatar et rappel.
 * Seuls les administrateurs peuvent modifier le rôle d'un utilisateur ou le profil d'autrui.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const isSelf = session.user.id === id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isSelf && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { role, password, name, avatarUrl, reminderHoursBefore } = parsed.data;

    // Seul un ADMIN peut modifier un rôle
    if (role && !isAdmin) {
      return NextResponse.json(
        { error: "Seul un administrateur peut modifier les rôles" },
        { status: 403 }
      );
    }

    // Protection : un ADMIN ne peut pas rétrograder le dernier ADMIN
    if (role && role !== "ADMIN") {
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (targetUser?.role === "ADMIN") {
        const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Impossible de modifier le rôle du dernier administrateur" },
            { status: 400 }
          );
        }
      }
    }

    // Si changement de mot de passe, hasher
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(role && isAdmin ? { role } : {}),
        ...(reminderHoursBefore !== undefined ? { reminderHoursBefore } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        reminderHoursBefore: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erreur PATCH /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[id] — Supprime un utilisateur.
 * Réservé exclusivement aux administrateurs.
 * Règle stricte : impossible de supprimer le dernier ADMIN du projet.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Protection absolue du dernier administrateur
    if (user.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Action impossible : impossible de supprimer le dernier administrateur du projet." },
          { status: 400 }
        );
      }
    }

    // Suppression de l'utilisateur (les cascades et SetNull sont gérés par le schéma Prisma)
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
