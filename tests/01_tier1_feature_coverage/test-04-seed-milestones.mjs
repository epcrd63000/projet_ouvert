import { fetchAllMilestones, closeDatabaseConnection } from "../00_common/db-client.mjs";
import { expectedMilestones } from "../00_common/config.mjs";

/**
 * Test T1.4 : Vérification stricte des 11 jalons Gantt IMT issus du script de seed.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.4: Vérification des 11 jalons Gantt seedés...");

  try {
    const milestones = await fetchAllMilestones();
    console.log(`  - Nombre de jalons trouvés en base : ${milestones.length} (attendu : 11)`);

    if (milestones.length !== 11) {
      throw new Error(
        `Critère d'acceptation non satisfait: 11 jalons requis, ${milestones.length} trouvés.`
      );
    }

    const milestoneNames = new Set(milestones.map((m) => m.name.trim().toLowerCase()));

    for (const expectedName of expectedMilestones) {
      if (!milestoneNames.has(expectedName.toLowerCase())) {
        throw new Error(`Jalon officiel IMT manquant en base : "${expectedName}"`);
      }
    }

    // Vérification de la propriété isPreloaded si définie
    const notPreloaded = milestones.filter((m) => m.isPreloaded === false);
    if (notPreloaded.length > 0) {
      console.warn(`  ⚠️ Avertissement : ${notPreloaded.length} jalons ont isPreloaded=false.`);
    }

    console.log("  ✓ Les 11 jalons officiels IMT sont présents et validés.");
    return { name: "T1.4 Jalons Gantt Seedés", passed: true, milestoneCount: milestones.length };
  } finally {
    await closeDatabaseConnection();
  }
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-04-seed-milestones.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
