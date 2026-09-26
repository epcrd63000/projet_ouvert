import { handlers } from "@/lib/auth";

/**
 * Route API NextAuth v5 (Auth.js) pour Next.js App Router.
 * Expose les méthodes GET et POST pour gérer les sessions, CSRF et callbacks d'authentification.
 */
export const { GET, POST } = handlers;
