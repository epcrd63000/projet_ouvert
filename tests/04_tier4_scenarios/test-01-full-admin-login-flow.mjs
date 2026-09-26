import { HttpClient } from "../00_common/http-client.mjs";
import { testPasswords } from "../00_common/config.mjs";

/**
 * Test T4.1 : Scénario utilisateur réel de bout en bout (Login Admin -> Dashboard).
 */
export async function runTest() {
  console.log("▶ [Tier 4] Test 4.1: Parcours utilisateur réel complet (Admin -> Dashboard)...");

  const client = new HttpClient();

  // Étape 1 : L'utilisateur non authentifié tente d'accéder à la racine '/'
  console.log("  - Étape 1 : Accès anonyme à '/'...");
  const rootRes = await client.get("/", { redirect: "manual" });
  const rootLocation = rootRes.headers.get("location") || "";

  if (!rootLocation.includes("/login")) {
    throw new Error(
      `L'accès non authentifié à '/' n'a pas redirigé vers '/login' (reçu: '${rootLocation}', HTTP ${rootRes.status})`
    );
  }
  console.log("  ✓ Redirection racine vers '/login' confirmée.");

  // Étape 2 : Chargement de la page de connexion '/login'
  console.log("  - Étape 2 : Chargement de la page '/login'...");
  const loginPageRes = await client.get("/login");
  if (loginPageRes.status !== 200) {
    throw new Error(
      `Impossible de charger l'interface de connexion '/login' : HTTP ${loginPageRes.status}`
    );
  }
  console.log("  ✓ Interface de connexion accessible (HTTP 200).");

  // Étape 3 : Récupération du token CSRF et soumission du formulaire
  console.log("  - Étape 3 : Authentification avec les identifiants d'Etienne (Admin)...");
  let loginSuccess = false;

  for (const pwd of testPasswords) {
    client.clearCookies();
    const { sessionToken } = await client.authenticate("etienne@imt.fr", pwd);
    if (sessionToken) {
      loginSuccess = true;
      break;
    }
  }

  if (!loginSuccess) {
    throw new Error(
      `Échec de connexion pour etienne@imt.fr avec les mots de passe de test (${testPasswords.join(", ")})`
    );
  }
  console.log("  ✓ Jeton de session NextAuth émis et stocké dans le client.");

  // Étape 4 : Navigation vers le tableau de bord '/dashboard' avec le cookie de session
  console.log("  - Étape 4 : Accès authentifié à '/dashboard'...");
  const dashboardRes = await client.get("/dashboard", { redirect: "manual" });

  if (dashboardRes.status === 307 || dashboardRes.status === 302) {
    const redirectUrl = dashboardRes.headers.get("location") || "";
    if (redirectUrl.includes("/login")) {
      throw new Error(
        "ÉCHEC : L'accès à '/dashboard' a été redirigé vers '/login' malgré une session active !"
      );
    }
  }

  if (dashboardRes.status !== 200 && dashboardRes.status !== 304) {
    throw new Error(
      `Statut inattendu pour '/dashboard' avec session active : HTTP ${dashboardRes.status}`
    );
  }

  console.log("  ✓ Tableau de bord '/dashboard' accessible avec statut 200 OK.");
  return { name: "T4.1 Parcours Complet Admin -> Dashboard", passed: true };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-01-full-admin-login-flow.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
