/**
 * Test d'intégration pour la vérification du flux d'authentification par prénom et email.
 * Vérifie que les membres peuvent se connecter avec leur prénom simple insensible à la casse.
 */

import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { matchUserIdentifier } from "../lib/auth/credentialsLogic";

async function runAuthIntegrationTest() {
  console.log("🧪 Lancement du test d'intégration d'authentification multi-identifiants...");

  const allUsers = await prisma.user.findMany();
  console.log(`  - ${allUsers.length} utilisateurs chargés depuis Neon.`);

  const hugo = allUsers.find((u) => matchUserIdentifier(u, "hugo"));
  if (!hugo) {
    throw new Error("Hugo RAMPAZZO non trouvé avec l'identifiant 'hugo' !");
  }
  console.log(`  ✓ Utilisateur résolu : ${hugo.name} (${hugo.email})`);

  // Vérification de la compatibilité bcrypt avec son mot de passe temporaire
  if (!hugo.tempPassword) {
    throw new Error("Hugo n'a pas de tempPassword renseigné !");
  }

  const isValidPassword = await bcrypt.compare(hugo.tempPassword, hugo.passwordHash);
  if (!isValidPassword) {
    throw new Error("Le mot de passe temporaire ne correspond pas au hash en base !");
  }
  console.log("  ✓ Validation du mot de passe bcrypt réussie pour 'hugo'.");

  // Test de matching pour tous les membres
  const memberLogins = ["etienne", "liam", "hugo", "milane", "solal", "peter"];
  for (const login of memberLogins) {
    const matched = allUsers.find((u) => matchUserIdentifier(u, login));
    if (!matched) {
      throw new Error(`Échec de matching pour le login '${login}'`);
    }
    console.log(`  ✓ Login '${login}' résolu vers ${matched.name} (${matched.email})`);
  }

  console.log("✅ Test d'intégration d'authentification validé avec succès !");
}

runAuthIntegrationTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Échec du test :", err);
    process.exit(1);
  });
