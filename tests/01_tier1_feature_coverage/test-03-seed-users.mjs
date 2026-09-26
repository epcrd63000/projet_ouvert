import { fetchAllUsers, closeDatabaseConnection } from "../00_common/db-client.mjs";
import { expectedUsers } from "../00_common/config.mjs";

/**
 * Test T1.3 : Vérification stricte des 6 utilisateurs issus du script de seed.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.3: Vérification des 6 utilisateurs seedés...");

  try {
    const users = await fetchAllUsers();
    console.log(`  - Nombre d'utilisateurs trouvés en base : ${users.length} (attendu : 6)`);

    if (users.length !== 6) {
      throw new Error(`Critère d'acceptation non satisfait: 6 utilisateurs requis, ${users.length} trouvés.`);
    }

    const emailMap = new Map(users.map((u) => [u.email.toLowerCase(), u]));

    for (const expected of expectedUsers) {
      const user = emailMap.get(expected.email.toLowerCase());
      if (!user) {
        throw new Error(`Utilisateur obligatoire manquant : ${expected.email}`);
      }
      if (user.role !== expected.role) {
        throw new Error(
          `Rôle incorrect pour ${expected.email} : attendu '${expected.role}', trouvé '${user.role}'`
        );
      }
      if (!user.passwordHash || user.passwordHash.length < 20) {
        throw new Error(`Le mot de passe pour ${expected.email} n'est pas correctement hashé.`);
      }
    }

    console.log("  ✓ Les 6 utilisateurs attendus sont présents avec leurs rôles respectifs.");
    return { name: "T1.3 Utilisateurs Seedés", passed: true, userCount: users.length };
  } finally {
    await closeDatabaseConnection();
  }
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-03-seed-users.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
