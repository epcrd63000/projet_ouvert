import { execSync } from "node:child_process";
import path from "node:path";
import { prisma } from "../../app/src/lib/prisma";

/**
 * Test T5.3 : Validation TypeScript stricte et rejet des violations de contraintes.
 * Teste tsc --noEmit, les contraintes de clés étrangères (P2003) et d'unicité (P2002).
 */
export async function runTest(): Promise<{
  tscPassed: boolean;
  fkConstraintRejected: boolean;
  uniqueConstraintRejected: boolean;
  compositeUniqueRejected: boolean;
}> {
  console.log("▶ [Tier 5] Test 5.3: Type-checking tsc et validation des contraintes BDD...");

  // 1. Exécution programmatique de npx tsc --noEmit
  const appDir = path.resolve(process.cwd());
  console.log(`  - Exécution de 'npx tsc --noEmit' dans ${appDir}...`);
  let tscPassed = false;
  try {
    execSync("npx tsc --noEmit", { cwd: appDir, stdio: "pipe" });
    tscPassed = true;
    console.log("  ✓ Compilation TypeScript sans aucune erreur de typage (Code 0).");
  } catch (err: unknown) {
    const errorOutput =
      (err as { stdout?: Buffer; stderr?: Buffer }).stderr?.toString() ||
      (err as { stdout?: Buffer; stderr?: Buffer }).stdout?.toString();
    console.error("  ❌ Erreurs TypeScript détectées :", errorOutput);
    throw new Error(`Échec tsc --noEmit : ${errorOutput}`);
  }

  // 2. Test négatif : Rejet de clé étrangère invalide (P2003)
  console.log("  - Test négatif : Tentative d'insertion d'une tâche avec projectId inexistant...");
  let fkRejected = false;
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) throw new Error("Aucun utilisateur pour le test.");

  try {
    await prisma.task.create({
      data: {
        projectId: "00000000-dead-beef-0000-000000000000",
        createdById: adminUser.id,
        title: "Tâche orpheline interdite",
        position: 99,
      },
    });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2003") {
      fkRejected = true;
      console.log("  ✓ Contrainte de clé étrangère PostgreSQL (P2003) correctement appliquée.");
    } else {
      console.error("  ❌ Erreur inattendue lors du test FK :", err);
    }
  }

  if (!fkRejected) {
    throw new Error("Échec Sécurité : La BDD a accepté une clé étrangère inexistante.");
  }

  // 3. Test négatif : Rejet d'unicité d'email (P2002)
  console.log("  - Test négatif : Tentative de création d'un utilisateur avec email déjà existant...");
  let uniqueRejected = false;
  try {
    await prisma.user.create({
      data: {
        email: "etienne@imt.fr",
        name: "Usurpateur",
        passwordHash: "$2a$10$fakehash",
      },
    });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      uniqueRejected = true;
      console.log("  ✓ Contrainte d'unicité d'email (P2002) correctement appliquée.");
    }
  }

  if (!uniqueRejected) {
    throw new Error("Échec Sécurité : La BDD a accepté un email en double.");
  }

  // 4. Test négatif : Rejet de contrainte d'unicité composite sur TaskAssignment (P2002)
  console.log("  - Test négatif : Tentative d'assignation en doublon (taskId, userId)...");
  let compositeRejected = false;
  const existingProject = await prisma.project.findFirst();
  if (!existingProject) throw new Error("Aucun projet existant.");

  const tempTask = await prisma.task.create({
    data: {
      projectId: existingProject.id,
      createdById: adminUser.id,
      title: "Tâche test composite",
      position: 100,
    },
  });

  try {
    // Première assignation
    await prisma.taskAssignment.create({
      data: { taskId: tempTask.id, userId: adminUser.id },
    });

    // Deuxième assignation identique (doit échouer)
    await prisma.taskAssignment.create({
      data: { taskId: tempTask.id, userId: adminUser.id },
    });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      compositeRejected = true;
      console.log("  ✓ Contrainte composite @@unique([taskId, userId]) (P2002) respectée.");
    }
  } finally {
    await prisma.task.delete({ where: { id: tempTask.id } }).catch(() => {});
  }

  if (!compositeRejected) {
    throw new Error("Échec Sécurité : La BDD a accepté une double assignation de tâche.");
  }

  console.log("  ✓ Type-checking strict et robustesse des contraintes relationnelles validés.");
  return {
    tscPassed,
    fkConstraintRejected: fkRejected,
    uniqueConstraintRejected: uniqueRejected,
    compositeUniqueRejected: compositeRejected,
  };
}

if (process.argv[1] && process.argv[1].includes("test-03-type-safety-and-constraints")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
