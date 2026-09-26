import { prisma as prismaInstance1 } from "../../app/src/lib/prisma";
import type { PrismaClient } from "@prisma/client";

/**
 * Test T5.1 : Validation du comportement singleton de src/lib/prisma.ts.
 * Vérifie l'unicité de l'instance, l'ancrage sur globalThis et la résistance
 * à la concurrence.
 */
export async function runTest(): Promise<{
  isSingleton: boolean;
  isAttachedToGlobal: boolean;
  concurrencyPassed: boolean;
  queriesCount: number;
}> {
  console.log("▶ [Tier 5] Test 5.1: Vérification du Singleton PrismaClient...");

  // 1. Contrôle d'unicité par import direct
  const globalObj = globalThis as unknown as { prisma?: PrismaClient };
  const prismaInstance2 = (await import("../../app/src/lib/prisma")).prisma;

  const isStrictlyIdentical = prismaInstance1 === prismaInstance2;
  console.log(`  - Référence import 1 === import 2 : ${isStrictlyIdentical}`);
  if (!isStrictlyIdentical) {
    throw new Error("Échec Singleton : Deux imports distincts ont produit des instances différentes.");
  }

  // 2. Contrôle de l'attachement à globalThis en environnement hors production
  const isAttached = globalObj.prisma === prismaInstance1;
  console.log(`  - Instance attachée à globalThis.prisma : ${isAttached}`);
  if (process.env.NODE_ENV !== "production" && !isAttached) {
    throw new Error("Échec Singleton : En dev/test, l'instance doit être attachée à globalThis.prisma.");
  }

  // 3. Test de réutilisation d'instance pré-existante (simulation hot-reload)
  const priorInstance = globalObj.prisma;
  const dynamicallyReimported = (await import(`../../app/src/lib/prisma?reload=${Date.now()}`)).prisma;
  const isHotReloadSafe = dynamicallyReimported === priorInstance;
  console.log(`  - Persistance après rechargement dynamique : ${isHotReloadSafe}`);
  if (!isHotReloadSafe) {
    throw new Error("Échec Singleton : Une nouvelle instance a été créée malgré la présence sur globalThis.");
  }

  // 4. Test de charge concurrente sur le singleton
  console.log("  - Test de stress concurrent (10 requêtes simultanées via le singleton)...");
  const concurrentQueries = Array.from({ length: 10 }, (_, idx) =>
    prismaInstance1.user.findFirst({
      select: { id: true, email: true },
    }).then((user) => ({ queryIdx: idx, success: !!user }))
  );

  const results = await Promise.all(concurrentQueries);
  const allSuccessful = results.every((r) => r.success);
  console.log(`  - 10 requêtes concurrentes réussies : ${allSuccessful}`);
  if (!allSuccessful) {
    throw new Error("Échec Concurrence : Certaines requêtes concurrentes ont échoué.");
  }

  console.log("  ✓ Comportement singleton et résistance concurrente validés avec succès.");
  return {
    isSingleton: isStrictlyIdentical,
    isAttachedToGlobal: isAttached,
    concurrencyPassed: allSuccessful,
    queriesCount: results.length,
  };
}

if (process.argv[1] && process.argv[1].includes("test-01-prisma-singleton")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
