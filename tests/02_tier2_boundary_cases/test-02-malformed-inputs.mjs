import { HttpClient } from "../00_common/http-client.mjs";

/**
 * Test T2.2 : Rejet des entrées malformées, champs vides et tentatives d'injection.
 */
export async function runTest() {
  console.log("▶ [Tier 2] Test 2.2: Rejet entrées malformées & injections...");

  const client = new HttpClient();
  const testPayloads = [
    { label: "Champs vides", email: "", password: "" },
    { label: "Email malformé (sans arobase)", email: "pasunemail", password: "password123" },
    { label: "Email malformé (sans domaine)", email: "utilisateur@", password: "password123" },
    { label: "Email malformé (sans identifiant)", email: "@domaine.fr", password: "password123" },
    { label: "Injection SQL classique", email: "' OR '1'='1", password: "' OR '1'='1" },
    { label: "Injection SQL commentaire", email: "admin'--", password: "password123" },
    { label: "Payload caractères de contrôle", email: "etienne\u0000@imt.fr", password: "pwd" },
  ];

  for (const { label, email, password } of testPayloads) {
    client.clearCookies();
    const result = await client.authenticate(email, password);
    const res = result.response;
    const cookie = result.sessionToken;

    if (cookie) {
      throw new Error(`FAILLE DE SÉCURITÉ : Session créée pour le cas '${label}' !`);
    }

    if (res.status >= 500) {
      throw new Error(
        `Erreur serveur 500 non gérée pour l'entrée '${label}' : le serveur a planté !`
      );
    }

    console.log(`  ✓ Cas '${label}' correctement rejeté (HTTP ${res.status}).`);
  }

  console.log("  ✓ Toutes les entrées malformées et adversariales ont été neutralisées.");
  return { name: "T2.2 Entrées Malformées & Injections", passed: true };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-02-malformed-inputs.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
