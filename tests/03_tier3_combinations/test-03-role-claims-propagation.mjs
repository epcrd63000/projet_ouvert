import { HttpClient } from "../00_common/http-client.mjs";
import { testPasswords } from "../00_common/config.mjs";

/**
 * Tente la connexion avec les mots de passe connus et retourne les données de session.
 * @param {HttpClient} client
 * @param {string} email
 * @returns {Promise<any>}
 */
async function loginAndGetSession(client, email) {
  for (const pwd of testPasswords) {
    client.clearCookies();
    await client.authenticate(email, pwd);
    const sessionRes = await client.get("/api/auth/session");
    if (sessionRes.ok) {
      const data = await sessionRes.json();
      if (data && data.user) return data;
    }
  }
  throw new Error(`Impossible d'ouvrir une session pour ${email} avec les mots de passe de test.`);
}

/**
 * Test T3.3 : Vérification de la propagation des rôles (ADMIN et MEMBER) dans l'objet session.
 */
export async function runTest() {
  console.log("▶ [Tier 3] Test 3.3: Propagation des rôles JWT & Session...");

  const client = new HttpClient();

  // 1. Vérification du rôle Administrateur pour Etienne
  console.log("  - Test 1 : Vérification du rôle ADMIN pour etienne@imt.fr...");
  const adminSession = await loginAndGetSession(client, "etienne@imt.fr");
  console.log("  - Objet session admin reçu :", JSON.stringify(adminSession.user));

  if (adminSession.user.role !== "ADMIN") {
    throw new Error(
      `Rôle ADMIN attendu pour etienne@imt.fr, mais reçu '${adminSession.user.role}'`
    );
  }
  if (!adminSession.user.id) {
    throw new Error("L'identifiant UUID de l'utilisateur est manquant dans session.user.id");
  }
  console.log("  ✓ Profil et rôle ADMIN correctement propagés.");

  // 2. Vérification du rôle Membre pour Hugo
  console.log("  - Test 2 : Vérification du rôle MEMBER pour hugo@imt.fr...");
  const memberSession = await loginAndGetSession(client, "hugo@imt.fr");
  console.log("  - Objet session membre reçu :", JSON.stringify(memberSession.user));

  if (memberSession.user.role !== "MEMBER") {
    throw new Error(
      `Rôle MEMBER attendu pour hugo@imt.fr, mais reçu '${memberSession.user.role}'`
    );
  }
  console.log("  ✓ Profil et rôle MEMBER correctement propagés.");

  return { name: "T3.3 Propagation Rôles JWT/Session", passed: true };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-03-role-claims-propagation.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
