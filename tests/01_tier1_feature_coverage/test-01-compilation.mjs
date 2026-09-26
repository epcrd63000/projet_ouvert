import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { appDir, schemaPath } from "../00_common/config.mjs";

/**
 * Test T1.1 : Vérification de la compilation Next.js et de la validité du schéma Prisma.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.1: Compilation Next.js & Validation Prisma...");

  // 1. Vérification de la présence du projet dans app/
  if (!fs.existsSync(appDir)) {
    throw new Error(`Le dossier cible de l'application n'existe pas : ${appDir}`);
  }

  const pkgPath = path.resolve(appDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`Le fichier package.json est absent de ${appDir}`);
  }

  // 2. Vérification de la validation du schéma Prisma
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Le schéma Prisma est absent : ${schemaPath}`);
  }

  console.log("  - Validation du schéma Prisma avec `npx prisma validate`...");
  try {
    execSync("npx prisma validate", {
      cwd: appDir,
      stdio: "pipe",
      encoding: "utf-8",
    });
    console.log("  ✓ Schéma Prisma valide.");
  } catch (err) {
    const output = (err.stdout || "") + (err.stderr || "");
    throw new Error(`Échec de 'npx prisma validate' :\n${output.trim()}`);
  }

  // 3. Vérification de la compilation Next.js
  console.log("  - Exécution du build Next.js avec `npm run build`...");
  try {
    execSync("npm run build", {
      cwd: appDir,
      stdio: "pipe",
      encoding: "utf-8",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    });
    console.log("  ✓ Build Next.js terminé avec succès (code 0).");
  } catch (err) {
    const output = (err.stdout || "") + (err.stderr || "");
    throw new Error(`Échec du build Next.js :\n${output.trim()}`);
  }

  return { name: "T1.1 Compilation & Schéma", passed: true };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-01-compilation.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
