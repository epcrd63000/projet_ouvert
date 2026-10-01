import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Middleware d'authentification et de protection des routes (Edge Runtime).
 * Intercepte les requêtes pour appliquer les règles d'accès sécurisé et de redirection.
 */
export default auth((req: any) => { // eslint-disable-line
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  // 1. Redirection pour la racine '/'
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 2. Redirection des utilisateurs déjà connectés visitant /login
  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // 3. Protection de toutes les autres routes d'application
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Intercepte toutes les routes à l'exception de :
     * - api/auth (points d'entrée NextAuth : CSRF, session, callback)
     * - api/health (sonde de santé pour les vérifications de statut)
     * - _next/static, _next/image (fichiers statiques et médias compilés)
     * - favicon.ico et images statiques (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
