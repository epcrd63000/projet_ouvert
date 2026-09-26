import { runTest as runT11 } from "./01_tier1_feature_coverage/test-01-compilation.mjs";
import { runTest as runT12 } from "./01_tier1_feature_coverage/test-02-database-tables.mjs";
import { runTest as runT13 } from "./01_tier1_feature_coverage/test-03-seed-users.mjs";
import { runTest as runT14 } from "./01_tier1_feature_coverage/test-04-seed-milestones.mjs";
import { runTest as runT15 } from "./01_tier1_feature_coverage/test-05-root-redirect.mjs";

import { runTest as runT21 } from "./02_tier2_boundary_cases/test-01-invalid-credentials.mjs";
import { runTest as runT22 } from "./02_tier2_boundary_cases/test-02-malformed-inputs.mjs";
import { runTest as runT23 } from "./02_tier2_boundary_cases/test-03-unauthorized-access.mjs";

import { runTest as runT31 } from "./03_tier3_combinations/test-01-seed-bcrypt-compat.mjs";
import { runTest as runT32 } from "./03_tier3_combinations/test-02-session-cookie-creation.mjs";
import { runTest as runT33 } from "./03_tier3_combinations/test-03-role-claims-propagation.mjs";

import { runTest as runT41 } from "./04_tier4_scenarios/test-01-full-admin-login-flow.mjs";
import { runTest as runT42 } from "./04_tier4_scenarios/test-02-session-lifecycle.mjs";

// Définition de l'ensemble des 13 suites de tests réparties sur les 4 tiers
const allSuites = [
  { tier: 1, id: "T1.1", name: "Compilation & Validation Prisma", fn: runT11 },
  { tier: 1, id: "T1.2", name: "Présence Tables PostgreSQL (10/11)", fn: runT12 },
  { tier: 1, id: "T1.3", name: "Validation 6 Utilisateurs Seedés", fn: runT13 },
  { tier: 1, id: "T1.4", name: "Validation 11 Jalons Gantt IMT", fn: runT14 },
  { tier: 1, id: "T1.5", name: "Redirection Racine HTTP '/' -> '/login'", fn: runT15 },

  { tier: 2, id: "T2.1", name: "Rejet Identifiants Invalides", fn: runT21 },
  { tier: 2, id: "T2.2", name: "Rejet Entrées Malformées & Injections", fn: runT22 },
  { tier: 2, id: "T2.3", name: "Protection Routes Privées (/dashboard)", fn: runT23 },

  { tier: 3, id: "T3.1", name: "Compatibilité Seed BDD & Hash Bcrypt", fn: runT31 },
  { tier: 3, id: "T3.2", name: "Création Cookie de Session NextAuth", fn: runT32 },
  { tier: 3, id: "T3.3", name: "Propagation des Rôles JWT / Session", fn: runT33 },

  { tier: 4, id: "T4.1", name: "Parcours Complet Admin -> Dashboard", fn: runT41 },
  { tier: 4, id: "T4.2", name: "Cycle de Vie Complet de Session", fn: runT42 },
];

/**
 * Runner global exécutant les tests de la suite E2E.
 */
async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find((a) => a.startsWith("--tier="))?.split("=")[1];
  const bail = args.includes("--bail");

  const targetTier = tierArg ? parseInt(tierArg, 10) : null;
  const suitesToRun = targetTier
    ? allSuites.filter((s) => s.tier === targetTier)
    : allSuites;

  console.log("================================================================================");
  console.log("🧪 Lancement de la Suite de Tests E2E Opaque-Box — IMT Projet Ouvert");
  if (targetTier) console.log(`🎯 Filtre actif : Tier ${targetTier} uniquement`);
  console.log(`📋 Nombre de suites sélectionnées : ${suitesToRun.length}`);
  console.log("================================================================================\n");

  const results = [];
  const startTime = Date.now();

  for (const suite of suitesToRun) {
    const suiteStart = Date.now();
    try {
      await suite.fn();
      const duration = Date.now() - suiteStart;
      results.push({ ...suite, status: "PASS", duration, error: null });
      console.log(`✅ [${suite.id}] PASS (${duration}ms)\n`);
    } catch (err) {
      const duration = Date.now() - suiteStart;
      results.push({ ...suite, status: "FAIL", duration, error: err.message });
      console.error(`❌ [${suite.id}] FAIL (${duration}ms) : ${err.message}\n`);
      if (bail) {
        console.warn("⛔ Option --bail active : arrêt immédiat du runner.");
        break;
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const passedCount = results.filter((r) => r.status === "PASS").length;
  const failedCount = results.filter((r) => r.status === "FAIL").length;

  console.log("================================================================================");
  console.log("📊 RÉSUMÉ GLOBAL DE LA SUITE DE TESTS");
  console.log("================================================================================");
  for (const res of results) {
    const icon = res.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${res.id}] (Tier ${res.tier}) ${res.name.padEnd(42)} [${res.status}] (${res.duration}ms)`);
    if (res.error) {
      console.log(`   └─ Erreur : ${res.error}`);
    }
  }
  console.log("--------------------------------------------------------------------------------");
  console.log(`Total: ${results.length} | Réussis: ${passedCount} | Échoués: ${failedCount} | Durée: ${totalTime}s`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((fatalErr) => {
  console.error("💥 Erreur fatale non gérée du test runner :", fatalErr);
  process.exit(1);
});
