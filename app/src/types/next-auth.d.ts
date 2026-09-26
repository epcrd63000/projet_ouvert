import { type DefaultSession } from "next-auth";
import { type Role } from "@prisma/client";

declare module "next-auth" {
  /**
   * Extension de la session utilisateur pour propager l'ID, le rôle applicatif et l'avatar.
   */
  interface Session {
    user: {
      id: string;
      role: Role;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }

  /**
   * Extension du modèle User retourné par la fonction authorize de NextAuth.
   */
  interface User {
    id?: string;
    role?: Role;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extension du jeton JWT pour stocker l'ID utilisateur et son rôle dans le cookie chiffré.
   */
  interface JWT {
    id?: string;
    role?: Role;
    avatarUrl?: string | null;
  }
}
