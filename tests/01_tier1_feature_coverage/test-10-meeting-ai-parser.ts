import assert from "assert";
import { parseAiMeetingReport, matchAssigneeToUser } from "../../app/src/lib/meetings/aiReportParser";

/**
 * Test T1.10 : Test unitaire du parseur de compte rendu IA (TDD).
 * Valide l'extraction robuste des objectifs, de la synthèse et des décisions
 * à partir de différents formats renvoyés par un LLM (ChatGPT, Gemini, etc.).
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.10: Parseur de Compte Rendu IA et ventilation...");

  const mockUsers = [
    { id: "u-etienne", name: "Etienne", email: "etienne@imt.fr" },
    { id: "u-liam", name: "Liam", email: "liam@imt.fr" },
    { id: "u-hugo", name: "Hugo", email: "hugo@imt.fr" },
    { id: "u-solal", name: "Solal", email: "solal@imt.fr" },
    { id: "u-milane", name: "Milane", email: "milane@imt.fr" },
    { id: "u-peter", name: "Peter", email: "peter@imt.fr" },
  ];

  // Cas 1 : Réponse avec balises explicites
  const taggedResponse = `
Voici le compte rendu structuré suite à votre réunion :

[OBJECTIFS]
1. Valider le dimensionnement de la quille du MINIMOCA.
2. Préparer les commandes de résine et fibre de verre.
[/OBJECTIFS]

[SYNTHESE]
## Revue technique
L'équipe a examiné les calculs hydrodynamiques présentés par Liam.
Les coefficients de traînée sont conformes aux attentes pour un voilier de cette jauge.
Hugo a alerté sur le délai de livraison des capteurs anémométriques.
[/SYNTHESE]

[DECISIONS]
- [Liam] [2026-10-15] Finaliser la modélisation CAO de la quille
- [Etienne] [2026-10-12] Valider et signer le devis pour la résine époxy
- [Hugo] Relancer le fournisseur pour les capteurs anémométriques
- [Solal] [20/10/2026] Réaliser le banc de test d'étanchéité
[/DECISIONS]
`;

  const parsed1 = parseAiMeetingReport(taggedResponse, mockUsers);

  assert.ok(parsed1.objectives.includes("Valider le dimensionnement"), "Les objectifs doivent être extraits");
  assert.ok(parsed1.synthesis.includes("Revue technique"), "La synthèse doit être extraite");
  assert.strictEqual(parsed1.decisions.length, 4, "4 décisions doivent être extraites");

  // Vérification de la première décision
  const dec1 = parsed1.decisions[0];
  assert.strictEqual(dec1.content, "Finaliser la modélisation CAO de la quille");
  assert.strictEqual(dec1.assigneeId, "u-liam");
  assert.strictEqual(dec1.dueDate, "2026-10-15");

  // Vérification de la 3ème décision (sans date)
  const dec3 = parsed1.decisions[2];
  assert.strictEqual(dec3.content, "Relancer le fournisseur pour les capteurs anémométriques");
  assert.strictEqual(dec3.assigneeId, "u-hugo");
  assert.strictEqual(dec3.dueDate, null);

  // Vérification de la 4ème décision (date au format JJ/MM/AAAA convertie en AAAA-MM-JJ)
  const dec4 = parsed1.decisions[3];
  assert.strictEqual(dec4.content, "Réaliser le banc de test d'étanchéité");
  assert.strictEqual(dec4.assigneeId, "u-solal");
  assert.strictEqual(dec4.dueDate, "2026-10-20");

  // Cas 2 : Réponse avec titres Markdown standards
  const markdownResponse = `
## 1. Objectifs de la séance
* Mettre au point la gouverne
* Répartir le travail de câblage

## 2. Synthèse des échanges
Discussion productive sur l'implantation de la batterie.
Etienne valide l'emplacement sous le pont principal.

## 3. Relevé de Décisions
- [Etienne] [2026-10-25] Commander le servo-moteur de barre
- [Milane] Schématiser le câblage électrique
`;

  const parsed2 = parseAiMeetingReport(markdownResponse, mockUsers);
  assert.ok(parsed2.objectives.includes("Mettre au point la gouverne"));
  assert.ok(parsed2.synthesis.includes("Discussion productive"));
  assert.strictEqual(parsed2.decisions.length, 2);
  assert.strictEqual(parsed2.decisions[0].assigneeId, "u-etienne");
  assert.strictEqual(parsed2.decisions[1].assigneeId, "u-milane");

  // Cas 3 : Test de matching d'assigné tolérant (insensible à la casse / prénom partiel)
  const matchedUser = matchAssigneeToUser("etienne", mockUsers);
  assert.strictEqual(matchedUser?.id, "u-etienne");

  const unknownUser = matchAssigneeToUser("Inconnu", mockUsers);
  assert.strictEqual(unknownUser, null);

  console.log("✅ [Tier 1] Test 1.10 réussi : Parseur IA conforme et validé !");
}

if (process.argv[1]?.includes("test-10-meeting-ai-parser")) {
  runTest().catch((err) => {
    console.error("❌ Échec Test 1.10:", err);
    process.exit(1);
  });
}
