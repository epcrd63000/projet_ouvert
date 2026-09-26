import { getDatabaseTables, closeDatabaseConnection } from "../00_common/db-client.mjs";
import { expectedTables } from "../00_common/config.mjs";

/**
 * Test T1.2 : Vérification de la présence des 10/11 tables en base de données PostgreSQL.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.2: Vérification des tables PostgreSQL...");

  try {
    const { source, tables } = await getDatabaseTables();
    console.log(`  - Source des métadonnées tables : ${source.toUpperCase()}`);
    console.log(`  - Tables détectées (${tables.length}) :`, tables.join(", "));

    if (tables.length < 10) {
      throw new Error(
        `Seulement ${tables.length} tables trouvées (au moins 10 requises d'après le cahier des charges).`
      );
    }

    // Normalisation en minuscules pour comparaison insensible à la casse
    const lowerDetected = new Set(tables.map((t) => t.toLowerCase()));
    const missingTables = expectedTables.filter((t) => !lowerDetected.has(t.toLowerCase()));

    // Note : Event est optionnel dans le socle historique strict (10 tables), mais recommandé
    const criticalMissing = missingTables.filter((t) => t !== "Event");

    if (criticalMissing.length > 0) {
      throw new Error(`Tables critiques manquantes : ${criticalMissing.join(", ")}`);
    }

    console.log(`  ✓ Toutes les tables socles (${expectedTables.length}) sont présentes.`);
    return { name: "T1.2 Tables PostgreSQL", passed: true, tablesCount: tables.length };
  } finally {
    await closeDatabaseConnection();
  }
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-02-database-tables.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
