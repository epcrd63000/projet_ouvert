import { auth } from "@/lib/auth";

/**
 * Vérifie si l'utilisateur actuel a le rôle ADMIN.
 * Retourne la session si oui, null sinon.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

/**
 * Vérifie si l'utilisateur est authentifié (tout rôle).
 * Retourne la session si oui, null sinon.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}

/**
 * Vérifie si l'utilisateur est ADMIN.
 */
export function isAdmin(role: string | undefined): boolean {
  return role === "ADMIN";
}
