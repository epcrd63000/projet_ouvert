import type { NextAuthConfig } from "next-auth";

/**
 * Configuration NextAuth.js v5 compatible avec l'Edge Runtime de Next.js.
 * ATTENTION : Ne jamais importer Prisma, bcryptjs ou d'autres modules natifs Node.js ici.
 */
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Durée de session de 30 jours
  },
  callbacks: {
    /**
     * Délègue la politique de redirection au middleware applicatif.
     */
    authorized() {
      return true;
    },
    /**
     * Enrichit le jeton JWT avec les attributs personnalisés lors de la connexion.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || (token.sub as string);
        if (user.role) token.role = user.role;
        if (user.avatarUrl) token.avatarUrl = user.avatarUrl;
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    /**
     * Propage les propriétés du jeton JWT dans l'objet de session client et serveur.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id || token.sub) as string;
        if (token.role) {
          session.user.role = token.role as "ADMIN" | "MEMBER";
        }
        if (token.avatarUrl !== undefined) {
          session.user.avatarUrl = token.avatarUrl as string | null;
        }
      }
      return session;
    },
  },
  providers: [], // Initialisé vide pour l'Edge Runtime, complété avec Credentials dans auth.ts
} satisfies NextAuthConfig;
