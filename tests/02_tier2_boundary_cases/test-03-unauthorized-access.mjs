import { HttpClient } from "../00_common/http-client.mjs";

/**
 * Test T2.3 : Blocage systématique de l'accès aux routes protégées sans session valide.
 */
export async function runTest() {
  console.log("▶ [Tier 2] Test 2.3: Protection des routes d'application privées...");

  const client = new HttpClient();
  const protectedRoutes = ["/dashboard", "/projects", "/api/protected"];

  for (const route of protectedRoutes) {
    const res = await client.get(route, { redirect: "manual" });
    const location = res.headers.get("location") || "";

    const isRedirect = res.status === 307 || res.status === 302 || res.status === 308;
    if (!isRedirect) {
      throw new Error(
        `Accès direct non autorisé à '${route}' permis ! Reçu statut HTTP ${res.status} au lieu d'une redirection.`
      );
    }

    if (!location.includes("/login")) {
      throw new Error(
        `La route '${route}' ne redirige pas vers '/login' mais vers '${location}'.`
      );
    }

    // Vérification que le corps de la réponse ne divulgue aucun contenu privé
    const bodyText = await res.text();
    if (bodyText.includes("Tableau de bord") || bodyText.includes("Projets IMT")) {
      throw new Error(
        `FUITE D'INFORMATIONS : Contenu confidentiel présent dans le corps de réponse 307 de '${route}' !`
      );
    }

    console.log(`  ✓ Route '${route}' protégée avec succès (redirection vers '${location}').`);
  }

  console.log("  ✓ Toutes les routes protégées sont strictement verrouillées par le middleware.");
  return { name: "T2.3 Protection Routes Privées", passed: true };
}

// Exécution directe si invoqué par Node.js
if (process.argv[1] && process.argv[1].endsWith("test-03-unauthorized-access.mjs")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
