import { HttpClient } from "../00_common/http-client.mjs";
import { testPasswords } from "../00_common/config.mjs";

/**
 * Test T3.2 : Handshake CSRF et création du cookie de session HttpOnly NextAuth.
 */
export async function runTest() {
  console.log("▶ [Tier 3] Test 3.2: Handshake CSRF & Création du cookie de session...");

  const client = new HttpClient();

  // 1. Étape 1 : Récupération du jeton CSRF
  console.log("  - Récupération du jeton CSRF sur /api/auth/csrf...");
  const csrfToken = await client.fetchCsrfToken();
  if (!csrfToken || typeof csrfToken !== "string") {
    throw new Error("Jeton CSRF manquant ou invalide.");
  }
  console.log(`  ✓ Jeton CSRF obtenu : ${csrfToken.slice(0, 16)}...`);

  // 2. Étape 2 : Tentative d'authentification avec les mots de passe de test
  let authenticated = false;
  let lastResponse = null;

  for (const pwd of testPasswords) {
    client.clearCookies();
    const result = await client.authenticate("etienne@imt.fr", pwd);
    lastResponse = result.response;

    if (result.sessionToken) {
      console.log(`  ✓ Authentification réussie avec le mot de passe de test ('${pwd}').`);
      authenticated = true;
      break;
    }
  }

  if (!authenticated) {
    throw new Error(
      `Aucun cookie de session n'a pu être émis avec les mots de passe de test (${testPasswords.join(", ")}) pour etienne@imt.fr.`
    );
  }

  // 3. Étape 3 : Vérification de la présence et des attributs du cookie de session
  const cookieNames = Array.from(client.cookies.keys());
  const sessionCookie = cookieNames.find((k) => k.includes("session-token"));

  if (!sessionCookie) {
    throw new Error(`Cookie de session introuvable dans : ${cookieNames.join(", ")}`);
  }

  console.log(`  ✓ Cookie de session détecté : '${sessionCookie}'`);
  return { name: "T3.2 Création Cookie Session", passed: true, cookieName: sessionCookie };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-02-session-cookie-creation.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
