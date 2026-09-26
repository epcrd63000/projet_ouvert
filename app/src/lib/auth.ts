import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

/**
 * Schéma de validation Zod pour le formulaire de connexion.
 */
const loginSchema = z.object({
  email: z.string().email("Format d'adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] 🔐 Tentative de connexion reçue");

        try {
          if (!credentials) {
            console.log("[auth] ❌ Pas de credentials fournis");
            return null;
          }

          const parsedCredentials = loginSchema.safeParse(credentials);
          if (!parsedCredentials.success) {
            console.log("[auth] ❌ Validation Zod échouée :", parsedCredentials.error.flatten());
            return null;
          }

          const { email, password } = parsedCredentials.data;
          console.log("[auth] 📧 Email reçu :", email);

          // Neutralisation défensive des caractères de contrôle et null bytes
          if (email.includes("\0") || password.includes("\0")) {
            console.log("[auth] ❌ Null bytes détectés dans les identifiants");
            return null;
          }

          const normalizedEmail = email.toLowerCase().trim();
          console.log("[auth] 🔍 Recherche utilisateur en base pour :", normalizedEmail);

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            console.log("[auth] ❌ Aucun utilisateur trouvé pour :", normalizedEmail);
            return null;
          }

          if (!user.passwordHash) {
            console.log("[auth] ❌ Utilisateur trouvé mais pas de passwordHash");
            return null;
          }

          console.log("[auth] ✅ Utilisateur trouvé :", user.name, "- Vérification du mot de passe...");

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
          if (!isPasswordValid) {
            console.log("[auth] ❌ Mot de passe invalide pour :", normalizedEmail);
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
          // Log l'erreur au lieu de l'avaler silencieusement
          console.error("[auth] 💥 ERREUR dans authorize() :", error);
          return null;
        }
      },
    }),
  ],
});
