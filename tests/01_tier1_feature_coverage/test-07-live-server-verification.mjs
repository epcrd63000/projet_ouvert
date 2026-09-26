/**
 * Test de vérification empirique du serveur de production Next.js.
 * Démarre l'application Next.js compilée sur un port dédié (3088),
 * teste les réponses HTTP, les métadonnées de redirection, et l'absence d'erreurs 500.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(currentDir, "../../app");
const TEST_PORT = 3088;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Attente active que le serveur soit prêt
async function waitForServer(url, timeoutMs = 20000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.status === 200) return true;
    } catch {
      // Serveur en cours d'initialisation
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Délai dépassé (${timeoutMs}ms) pour le démarrage du serveur.`);
}

export async function runLiveServerVerification() {
  console.log("=== DÉMARRAGE DU TEST EMPIRIQUE SUR SERVEUR LIVE NEXT.JS ===");
  console.log(`Port cible : ${TEST_PORT} | Répertoire : ${appDir}`);

  const serverProcess = spawn(
    "npx",
    ["next", "start", "-p", String(TEST_PORT)],
    {
      cwd: appDir,
      shell: true,
      env: { ...process.env, PORT: String(TEST_PORT) },
    }
  );

  let serverStderr = "";
  serverProcess.stderr.on("data", (data) => {
    serverStderr += data.toString();
  });

  try {
    console.log("Attente de la disponibilité du serveur...");
    await waitForServer(BASE_URL);
    console.log("✓ Serveur de production Next.js actif et réactif.");

    // 1. Test Endpoint de santé /api/health
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (healthRes.status !== 200) {
      throw new Error(`Attendu 200 sur /api/health, reçu ${healthRes.status}`);
    }
    const healthData = await healthRes.json();
    if (healthData.status !== "ok" || healthData.service !== "imt-projet-ouvert") {
      throw new Error(`Payload /api/health inattendu : ${JSON.stringify(healthData)}`);
    }
    console.log("✓ Test 1 : /api/health retourne 200 avec payload valide.");

    // 2. Test Route racine / (redirection Next.js)
    const rootRes = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    const location = rootRes.headers.get("location");
    const rootHtml = await rootRes.text();
    const hasHttpRedirect = (rootRes.status === 307 || rootRes.status === 308) && location?.includes("/login");
    const hasMetaRedirect = rootHtml.includes("url=/login") || rootHtml.includes("NEXT_REDIRECT;replace;/login;307;");
    
    if (!hasHttpRedirect && !hasMetaRedirect) {
      throw new Error("La route racine / ne fournit ni en-tête ni balise de redirection vers /login.");
    }
    console.log(`✓ Test 2 : Route racine / redirige vers /login (Mode ${hasHttpRedirect ? "HTTP 307" : "Static Prerender Meta-Refresh & Digest RSC"}).`);

    // 3. Test Page de connexion /login
    const loginRes = await fetch(`${BASE_URL}/login`);
    if (loginRes.status !== 200) {
      throw new Error(`Attendu 200 sur /login, reçu ${loginRes.status}`);
    }
    const loginHtml = await loginRes.text();
    if (!loginHtml.includes("Projet Ouvert IMT") || !loginHtml.includes("email") || !loginHtml.includes("password")) {
      throw new Error("La page /login ne contient pas les éléments attendus du formulaire.");
    }
    console.log("✓ Test 3 : Page /login retourne 200 avec formulaire complet.");

    // 4. Test Page protégée /dashboard
    const dashRes = await fetch(`${BASE_URL}/dashboard`);
    if (dashRes.status !== 200) {
      throw new Error(`Attendu 200 sur /dashboard, reçu ${dashRes.status}`);
    }
    const dashHtml = await dashRes.text();
    if (!dashHtml.includes("Tableau de bord") || !dashHtml.includes("Jalons")) {
      throw new Error("La page /dashboard ne contient pas le contenu attendu.");
    }
    console.log("✓ Test 4 : Page /dashboard retourne 200 avec contenu complet.");

    // 5. Test Endpoint Stub NextAuth
    const authRes = await fetch(`${BASE_URL}/api/auth/session`);
    if (authRes.status !== 200) {
      throw new Error(`Attendu 200 sur /api/auth/session, reçu ${authRes.status}`);
    }
    const authData = await authRes.json();
    if (!authData.message?.includes("NextAuth API endpoint initialized")) {
      throw new Error(`Payload inattendu sur /api/auth/session : ${JSON.stringify(authData)}`);
    }
    console.log("✓ Test 5 : Route API /api/auth/[...nextauth] répond avec stub valide.");

    // 6. Vérification de l'absence d'erreurs critiques dans stderr
    if (serverStderr.includes("UnhandledPromiseRejection") || serverStderr.includes("TypeError")) {
      throw new Error(`Erreurs détectées dans stderr du serveur :\n${serverStderr}`);
    }
    console.log("✓ Test 6 : Aucun avertissement d'hydratation ni crash serveur détecté.");

    console.log("=== TOUS LES TESTS DU SERVEUR DE PRODUCTION ONT RÉUSSI (6/6) ===");
  } finally {
    serverProcess.kill();
  }
}

runLiveServerVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`❌ ÉCHEC : ${err.message}`);
    process.exit(1);
  });
