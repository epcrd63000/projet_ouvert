import { runTest as runTest01 } from "./test-01-prisma-singleton";
import { runTest as runTest02 } from "./test-02-schema-relations";
import { runTest as runTest03 } from "./test-03-type-safety-and-constraints";

/**
 * Runner global unifié pour la suite de tests adversariaux du Tier 5 (Milestone 2).
 */
async function main() {
  console.log("================================================================================");
  console.log("🛡️ SUITE DE TESTS ADVERSARIAUX - CHALLENGER 2 (MILESTONE 2)");
  console.log("   Vérification Singleton Prisma, Relations Inter-Modèles, Typage & Contraintes");
  console.log("================================================================================\n");

  const suites = [
    { id: "T5.1", name: "Comportement Singleton PrismaClient & Concurrence", fn: runTest01 },
    { id: "T5.2", name: "Relations Multi-Modèles, Requêtes Profondes & Cascades", fn: runTest02 },
    { id: "T5.3", name: "Type-checking tsc & Robustesse des Contraintes BDD", fn: runTest03 },
  ];

  const results: Array<{ id: string; name: string; status: "PASS" | "FAIL"; duration: number; error: string | null }> = [];
  const startTime = Date.now();

  for (const suite of suites) {
    const suiteStart = Date.now();
    try {
      await suite.fn();
      const duration = Date.now() - suiteStart;
      results.push({ id: suite.id, name: suite.name, status: "PASS", duration, error: null });
      console.log(`✅ [${suite.id}] PASS (${duration}ms)\n`);
    } catch (err: unknown) {
      const duration = Date.now() - suiteStart;
      const message = err instanceof Error ? err.message : String(err);
      results.push({ id: suite.id, name: suite.name, status: "FAIL", duration, error: message });
      console.error(`❌ [${suite.id}] FAIL (${duration}ms) : ${message}\n`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("================================================================================");
  console.log("📊 BILAN DES TESTS ADVERSARIAUX (MILESTONE 2)");
  console.log("================================================================================");
  for (const res of results) {
    const icon = res.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${res.id}] ${res.name.padEnd(55)} [${res.status}] (${res.duration}ms)`);
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
  console.error("💥 Erreur fatale du runner :", err);
  process.exit(1);
});
