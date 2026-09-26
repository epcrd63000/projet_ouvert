import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Définition des chemins vers le projet app et les artefacts de build
const appDir = path.resolve(process.cwd(), "app");
const nextDir = path.resolve(appDir, ".next");

/**
 * Suite de tests adversariaux pour vérifier l'authenticité et l'intégrité du build Next.js.
 * Détecte les mocks codés en dur, les sorties fictives et valide les contraintes structurelles.
 */
export async function runTest() {
  console.log("▶ [Tier 5 - Adversarial] Test 5.3: Intégrité du build et absence de faux mocks...");

  // 1. Vérification de l'existence des artefacts de build Next.js
  assert.ok(fs.existsSync(nextDir), "Le dossier .next doit exister");

  const buildIdPath = path.resolve(nextDir, "BUILD_ID");
  assert.ok(fs.existsSync(buildIdPath), "Le fichier .next/BUILD_ID doit exister");
  const buildId = fs.readFileSync(buildIdPath, "utf-8").trim();
  assert.ok(buildId.length > 0, "BUILD_ID ne doit pas être vide");

  const buildManifestPath = path.resolve(nextDir, "build-manifest.json");
  assert.ok(fs.existsSync(buildManifestPath), "build-manifest.json doit exister");
  const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, "utf-8"));
  assert.ok(
    buildManifest.pages && typeof buildManifest.pages === "object",
    "build-manifest.json doit contenir la carte des pages réelles"
  );

  const prerenderManifestPath = path.resolve(nextDir, "prerender-manifest.json");
  assert.ok(fs.existsSync(prerenderManifestPath), "prerender-manifest.json doit exister");
  const prerenderManifest = JSON.parse(fs.readFileSync(prerenderManifestPath, "utf-8"));
  assert.ok(
    prerenderManifest.routes && typeof prerenderManifest.routes === "object",
    "prerender-manifest.json doit contenir les routes pré-rendues"
  );

  // Vérifier la présence des pages pré-rendues attendues
  const expectedRoutes = ["/", "/login", "/dashboard"];
  for (const route of expectedRoutes) {
    assert.ok(
      route in prerenderManifest.routes,
      `La route ${route} doit figurer dans le prerender-manifest réel`
    );
  }

  // 2. Vérification des fichiers HTML / React compilés sur le serveur
  const serverAppDir = path.resolve(nextDir, "server/app");
  assert.ok(fs.existsSync(serverAppDir), "Le dossier de compilation serveur .next/server/app doit exister");
  const serverFiles = fs.readdirSync(serverAppDir);
  assert.ok(serverFiles.length > 0, "Le dossier server/app ne doit pas être vide");

  // 3. Détection de contournements, fausses sorties ou mocks frauduleux dans le code source
  const srcDir = path.resolve(appDir, "src");
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const results = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanDir(fullPath));
      } else if (entry.isFile() && /\.(tsx?|jsx?|mjs)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allSourceFiles = scanDir(srcDir);
  for (const file of allSourceFiles) {
    const content = fs.readFileSync(file, "utf-8");
    // Recherche de faux outputs ou de simulations de réussite statique
    assert.ok(
      !content.includes("FAKE_BUILD_OUTPUT"),
      `Marqueur suspect dans ${file}: FAKE_BUILD_OUTPUT`
    );
    assert.ok(
      !content.includes("MOCK_PASS_ALL"),
      `Marqueur suspect dans ${file}: MOCK_PASS_ALL`
    );
  }

  // 4. Vérification de l'absence de fichiers de prompt interdits
  function scanForbidden(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "AGENTS.md" || entry.name === "GEMINI.md") {
        throw new Error(`Fichier interdit trouvé: ${path.join(dir, entry.name)}`);
      }
      if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
        scanForbidden(path.join(dir, entry.name));
      }
    }
  }
  scanForbidden(appDir);

  // 5. Vérification du respect strict du découpage (< 200 lignes par fichier de production)
  let maxProductionLines = 0;
  let maxProductionFile = "";
  const productionSourceFiles = allSourceFiles.filter((f) => !f.includes("__tests__"));

  for (const file of productionSourceFiles) {
    const lineCount = fs.readFileSync(file, "utf-8").split("\n").length;
    if (lineCount > maxProductionLines) {
      maxProductionLines = lineCount;
      maxProductionFile = file;
    }
    assert.ok(
      lineCount < 200,
      `Le fichier de production ${file} dépasse 200 lignes (${lineCount} lignes)`
    );
  }

  // Vérification distincte des fichiers de tests pour information
  const testFiles = allSourceFiles.filter((f) => f.includes("__tests__"));
  const oversizedTestFiles = [];
  for (const file of testFiles) {
    const count = fs.readFileSync(file, "utf-8").split("\n").length;
    if (count >= 200) {
      oversizedTestFiles.push({ file: path.relative(appDir, file), count });
    }
  }

  console.log(`  ✓ Artefacts de build réels et intègres vérifiés (.next, BUILD_ID=${buildId}).`);
  console.log(`  ✓ Aucun mock frauduleux ni fichier interdit.`);
  console.log(`  ✓ Tous les fichiers de production respectent strictement le découpage (< 200 lignes, max: ${path.basename(maxProductionFile)} avec ${maxProductionLines} lignes).`);
  if (oversizedTestFiles.length > 0) {
    console.warn(`  ⚠️ Remarque : Fichiers de tests internes excédant 200 lignes :`, oversizedTestFiles);
  }

  return {
    name: "T5.3 Build Integrity",
    passed: true,
    buildId,
    maxProductionLines,
    oversizedTestFiles,
  };
}

// Exécution directe avec Node
if (process.argv[1] && process.argv[1].endsWith("test-03-build-integrity.mjs")) {
  runTest()
    .then(() => {
      console.log("✅ SUCCÈS : Intégrité du build et authenticité validées.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
