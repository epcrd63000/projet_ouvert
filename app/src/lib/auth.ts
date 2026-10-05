import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { matchUserIdentifier } from "./auth/credentialsLogic";

/**
 * Schéma de validation Zod pour le formulaire de connexion.
 * Accepte l'identifiant (prénom simple, nom complet ou email).
 */
const loginSchema = z.object({
  identifier: z.string().trim().min(1, "L'identifiant est obligatoire"),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Identifiant", type: "text" },
        email: { label: "Identifiant ou Email", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] 🔐 Tentative de connexion reçue");

        try {
          if (!credentials) {
            console.log("[auth] ❌ Pas de credentials fournis");
            return null;
          }

          // Supporte indifféremment 'identifier' ou 'email' pour flexibilité
          const rawIdentifier = (
            (credentials.identifier as string) ||
            (credentials.email as string) ||
            ""
          ).trim();
          const rawPassword = (credentials.password as string) || "";

          const parsedCredentials = loginSchema.safeParse({
            identifier: rawIdentifier,
            password: rawPassword,
          });

          if (!parsedCredentials.success) {
            console.log("[auth] ❌ Validation échouée :", parsedCredentials.error.flatten());
            return null;
          }

          const { identifier, password } = parsedCredentials.data;

          // Neutralisation défensive des caractères de contrôle et null bytes
          if (identifier.includes("\0") || password.includes("\0")) {
            console.log("[auth] ❌ Caractères invalides détectés dans les identifiants");
            return null;
          }

          console.log("[auth] 🔍 Recherche utilisateur pour :", identifier);

          // Récupération de l'utilisateur avec matching intelligent (prénom, nom, email)
          const allUsers = await prisma.user.findMany();
          const user = allUsers.find((u) => matchUserIdentifier(u, identifier));

          if (!user) {
            console.log("[auth] ❌ Aucun utilisateur trouvé pour :", identifier);
            return null;
          }

          if (!user.passwordHash) {
            console.log("[auth] ❌ Utilisateur sans mot de passe configuré");
            return null;
          }

          console.log("[auth] ✅ Utilisateur trouvé :", user.name, "- Vérification du mot de passe...");

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
          if (!isPasswordValid) {
            console.log("[auth] ❌ Mot de passe invalide pour :", user.name);
            return null;
          }

          console.log("[auth] ✅ Connexion réussie pour :", user.name, "(", user.role, ")");

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
          };
        } catch (error) {
          console.error("[auth] 💥 ERREUR dans authorize() :", error);
          return null;
        }
      },
    }),
  ],
});
