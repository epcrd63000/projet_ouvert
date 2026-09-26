import { runTest as runTest01 } from "./test-01-cn-precedence.mjs";
import { runTest as runTest02 } from "./test-02-ui-primitives-rendering.mjs";
import { runTest as runTest03 } from "./test-03-build-integrity.mjs";

/**
 * Runner global exécutant l'ensemble de la suite de tests adversariaux du Tier 5 (Milestone 1).
 */
async function main() {
  console.log("================================================================================");
  console.log("🛡️ SUITE DE TESTS ADVERSARIAUX - CHALLENGER 2 (MILESTONE 1)");
  console.log("================================================================================\n");

  const suites = [
    { id: "T5.1", name: "Résolution des conflits et précédence avec cn()", fn: runTest01 },
    { id: "T5.2", name: "Rendu des composants UI et surcharge de classes", fn: runTest02 },
    { id: "T5.3", name: "Intégrité du build et absence de faux mocks", fn: runTest03 },
  ];

  const results = [];
  const start = Date.now();

  for (const suite of suites) {
    const suiteStart = Date.now();
    try {
      const res = await suite.fn();
      const duration = Date.now() - suiteStart;
      results.push({ ...suite, status: "PASS", duration, error: null, meta: res });
      console.log(`✅ [${suite.id}] PASS (${duration}ms)\n`);
    } catch (err) {
      const duration = Date.now() - suiteStart;
      results.push({ ...suite, status: "FAIL", duration, error: err.message });
      console.error(`❌ [${suite.id}] FAIL (${duration}ms) : ${err.message}\n`);
    }
  }

  const durationSec = ((Date.now() - start) / 1000).toFixed(2);
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("================================================================================");
  console.log("📊 RÉSUMÉ DES TESTS ADVERSARIAUX (MILESTONE 1)");
  console.log("================================================================================");
  for (const res of results) {
    const icon = res.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${res.id}] ${res.name.padEnd(50)} [${res.status}] (${res.duration}ms)`);
    if (res.error) console.log(`   └─ Erreur : ${res.error}`);
  }
  console.log("--------------------------------------------------------------------------------");
  console.log(`Total: ${results.length} | Réussis: ${passed} | Échoués: ${failed} | Durée: ${durationSec}s`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("💥 Erreur fatale :", err);
  process.exit(1);
});
