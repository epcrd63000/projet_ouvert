import { HttpClient } from "../00_common/http-client.mjs";

/**
 * Test T2.1 : Rejet systématique des identifiants invalides et comptes inexistants.
 */
export async function runTest() {
  console.log("▶ [Tier 2] Test 2.1: Rejet des identifiants erronés...");

  const client = new HttpClient();

  // 1. Test avec email valide mais mot de passe erroné
  console.log("  - Test 1 : Mot de passe erroné pour etienne@imt.fr...");
  const wrongPwdResult = await client.authenticate("etienne@imt.fr", "MauvaisMotDePasse_999!");
  const res1 = wrongPwdResult.response;
  const cookie1 = wrongPwdResult.sessionToken;

  if (cookie1) {
    throw new Error("ÉCHEC DE SÉCURITÉ : Un cookie de session a été émis pour un mot de passe erroné !");
  }

  const location1 = res1.headers.get("location") || "";
  const isRejected1 =
    res1.status === 401 ||
    location1.includes("error=CredentialsSignin") ||
    location1.includes("error=Callback");

  if (!isRejected1) {
    throw new Error(
      `Réponse inattendue pour mauvais mot de passe : statut HTTP ${res1.status}, Location: '${location1}'`
    );
  }
  console.log("  ✓ Connexion refusée comme prévu pour mauvais mot de passe.");

  // 2. Test avec compte utilisateur inexistant
  console.log("  - Test 2 : Tentative avec compte inexistant ghost@imt.fr...");
  client.clearCookies();
  const unknownResult = await client.authenticate("ghost@imt.fr", "password123");
  const res2 = unknownResult.response;
  const cookie2 = unknownResult.sessionToken;

  if (cookie2) {
    throw new Error("ÉCHEC DE SÉCURITÉ : Un cookie de session a été émis pour un utilisateur inexistant !");
  }

  const location2 = res2.headers.get("location") || "";
  const isRejected2 =
    res2.status === 401 ||
    location2.includes("error=CredentialsSignin") ||
    location2.includes("error=Callback");

  if (!isRejected2) {
    throw new Error(
      `Réponse inattendue pour compte inexistant : statut HTTP ${res2.status}, Location: '${location2}'`
    );
  }
  console.log("  ✓ Connexion refusée comme prévu pour compte inexistant.");

  return { name: "T2.1 Identifiants Invalides", passed: true };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-01-invalid-credentials.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
