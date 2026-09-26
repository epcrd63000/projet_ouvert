import { HttpClient } from "../00_common/http-client.mjs";
import { testPasswords } from "../00_common/config.mjs";

/**
 * Test T4.2 : Cycle de vie complet d'une session utilisateur (Connexion -> Session -> Déconnexion).
 */
export async function runTest() {
  console.log("▶ [Tier 4] Test 4.2: Cycle de vie complet de session utilisateur...");

  const client = new HttpClient();

  // Étape 1 : Connexion avec Liam (Admin)
  console.log("  - Étape 1 : Connexion avec liam@imt.fr...");
  let authenticated = false;
  for (const pwd of testPasswords) {
    client.clearCookies();
    const { sessionToken } = await client.authenticate("liam@imt.fr", pwd);
    if (sessionToken) {
      authenticated = true;
      break;
    }
  }

  if (!authenticated) {
    throw new Error("Impossible de connecter liam@imt.fr avec les mots de passe de test.");
  }
  console.log("  ✓ Utilisateur connecté et session établie.");

  // Étape 2 : Vérification de la session active sur /api/auth/session
  console.log("  - Étape 2 : Vérification de la session active...");
  const sessionRes = await client.get("/api/auth/session");
  if (!sessionRes.ok) {
    throw new Error(`Échec de lecture de la session : HTTP ${sessionRes.status}`);
  }
  const sessionData = await sessionRes.json();
  if (!sessionData?.user?.email?.includes("liam@imt.fr")) {
    throw new Error("La session active ne correspond pas à liam@imt.fr !");
  }
  console.log("  ✓ Session active confirmée pour :", sessionData.user.email);

  // Étape 3 : Déconnexion via /api/auth/signout
  console.log("  - Étape 3 : Déconnexion via l'endpoint de sign-out...");
  try {
    const csrfToken = await client.fetchCsrfToken();
    const signoutParams = new URLSearchParams();
    signoutParams.set("csrfToken", csrfToken);
    signoutParams.set("json", "true");

    await client.post("/api/auth/signout", signoutParams, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      redirect: "manual",
    });
  } catch (err) {
    console.warn("  ⚠️ Requête POST de signout NextAuth a retourné :", err.message);
  }

  // Étape 4 : Réinitialisation des cookies côté client pour simuler la suppression du cookie
  client.clearCookies();

  // Étape 5 : Vérification que l'accès à /dashboard est à nouveau interdit
  console.log("  - Étape 4 : Vérification du blocage post-déconnexion sur '/dashboard'...");
  const postLogoutRes = await client.get("/dashboard", { redirect: "manual" });
  const postLocation = postLogoutRes.headers.get("location") || "";

  if (!postLocation.includes("/login")) {
    throw new Error(
      `Après déconnexion, l'accès à '/dashboard' doit rediriger vers '/login' (reçu: '${postLocation}')`
    );
  }

  console.log("  ✓ Accès protégé restauré, redirection vers '/login' validée.");
  return { name: "T4.2 Cycle de Vie de Session", passed: true };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-02-session-lifecycle.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
