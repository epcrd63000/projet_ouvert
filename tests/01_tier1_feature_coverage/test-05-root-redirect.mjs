import { HttpClient } from "../00_common/http-client.mjs";

/**
 * Test T1.5 : Vérification de la redirection racine '/' -> '/login' pour les utilisateurs non authentifiés.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.5: Redirection racine HTTP '/' -> '/login'...");

  const client = new HttpClient();
  let res;

  try {
    res = await client.get("/", { redirect: "manual" });
  } catch (err) {
    throw new Error(
      `Impossible de joindre le serveur HTTP sur ${client.baseUrl}. Assurez-vous que l'application est démarrée ('npm run dev' ou 'npm start'). Erreur : ${err.message}`
    );
  }

  console.log(`  - Statut HTTP reçu pour '/' : ${res.status}`);
  const location = res.headers.get("location") || "";
  console.log(`  - En-tête Location reçu : '${location}'`);

  const isRedirectStatus = res.status === 307 || res.status === 302 || res.status === 308;
  if (!isRedirectStatus) {
    throw new Error(
      `Redirection attendue (code 307 ou 302), mais reçu statut HTTP ${res.status}`
    );
  }

  if (!location.includes("/login")) {
    throw new Error(
      `L'en-tête Location doit pointer vers '/login', mais pointe vers : '${location}'`
    );
  }

  console.log("  ✓ Redirection racine vers '/login' validée.");
  return { name: "T1.5 Redirection Racine", passed: true, status: res.status, location };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-05-root-redirect.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
