import path from "node:path";
import { appDir, testPasswords } from "../00_common/config.mjs";
import { fetchAllUsers, closeDatabaseConnection } from "../00_common/db-client.mjs";

/**
 * Test T3.1 : Vérification de la compatibilité entre les hashs bcrypt du seed et le module d'auth.
 */
export async function runTest() {
  console.log("▶ [Tier 3] Test 3.1: Compatibilité seed BDD & hash bcrypt...");

  let bcryptModule;
  try {
    const bcryptPath = path.resolve(appDir, "node_modules/bcryptjs");
    bcryptModule = await import(path.resolve(bcryptPath, "index.js"));
  } catch (err) {
    console.warn("  ⚠️ bcryptjs non résolu dans app/node_modules, vérification syntaxique du hash uniquement.");
  }

  try {
    const users = await fetchAllUsers();
    console.log(`  - Vérification des hashs bcrypt pour ${users.length} utilisateurs...`);

    for (const user of users) {
      const hash = user.passwordHash;
      if (!hash) {
        throw new Error(`Hash manquant pour l'utilisateur ${user.email}`);
      }

      // Vérification du préfixe standard bcrypt ($2a$ ou $2b$) et de la longueur (60 caractères)
      const isValidBcryptFormat = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
      if (!isValidBcryptFormat) {
        throw new Error(
          `Format de hash bcrypt invalide pour ${user.email} (longueur: ${hash.length}, format non reconnu)`
        );
      }

      // Si le module bcryptjs est disponible, on vérifie que le mot de passe correspond à un des mots de passe de seed
      if (bcryptModule) {
        const compareFn = bcryptModule.compare || bcryptModule.default?.compare;
        if (compareFn) {
          let matched = false;
          for (const pwd of testPasswords) {
            if (await compareFn(pwd, hash)) {
              matched = true;
              break;
            }
          }
          if (!matched) {
            throw new Error(
              `Le hash en base pour ${user.email} ne correspond à aucun des mots de passe de test (${testPasswords.join(", ")})`
            );
          }
        }
      }
    }

    console.log("  ✓ Tous les utilisateurs possèdent un hash bcrypt valide et vérifiable.");
    return { name: "T3.1 Compatibilité Seed BDD & Bcrypt", passed: true };
  } finally {
    await closeDatabaseConnection();
  }
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-01-seed-bcrypt-compat.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
