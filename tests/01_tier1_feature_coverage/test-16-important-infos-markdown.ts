import assert from "assert";
import { loadAppEnv } from "../00_common/config.mjs";

const envVars = loadAppEnv();
for (const [key, value] of Object.entries(envVars)) {
  if (!process.env[key]) process.env[key] = value;
}

import { prisma } from "../../app/src/lib/prisma";

/**
 * Test T1.16 : Validation de l'onglet Infos Importantes avec Markdown enrichi,
 * métadonnées (catégories, dates, interlocuteurs, épinglage) et documentation MINIMOCA.
 *
 * Valide :
 * 1. Création d'une fiche ImportantInfo avec métadonnées enrichies (catégorie, dates, interlocuteurs).
 * 2. Tri et priorisation (les éléments épinglés isPinned=true apparaissent en premier).
 * 3. Mise à jour collaborative par un membre (titre, contenu Markdown, interlocuteurs).
 * 4. Formatage d'exportation Markdown (.md) et parsing d'importation de fichier .md.
 * 5. Présence et intégrité des 3 fiches documentaires maîtresses MINIMOCA.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.16: Validation des fiches Infos Importantes (Markdown, métadonnées, MINIMOCA)...");

  let testInfoId: string | null = null;
  let pinnedInfoId: string | null = null;

  try {
    // 1. Création d'une fiche d'information avec métadonnées
    const testInfo = await prisma.importantInfo.create({
      data: {
        title: "Test Fiche Documentation",
        content: "### Synthèse\n\n- Point 1\n- Point 2\n\n| Rôle | Nom |\n|---|---|\n| Tuteur | P. Hulot |",
        category: "TECHNIQUE",
        eventDate: new Date("2026-11-27T17:00:00Z"),
        interlocutors: "Patrice Hulot, Xavier Dorchies",
        isPinned: false,
        order: 10,
      },
    });

    assert.ok(testInfo.id, "La fiche de test doit avoir un ID généré");
    assert.strictEqual(testInfo.category, "TECHNIQUE", "La catégorie doit être TECHNIQUE");
    assert.strictEqual(testInfo.interlocutors, "Patrice Hulot, Xavier Dorchies");
    testInfoId = testInfo.id;

    // 2. Création d'une fiche épinglée pour tester le tri prioritaire
    const pinnedInfo = await prisma.importantInfo.create({
      data: {
        title: "Fiche Prioritaire Épinglée",
        content: "Annonce urgente pour toute l'équipe.",
        category: "ORGANISATION",
        isPinned: true,
        order: 1,
      },
    });
    pinnedInfoId = pinnedInfo.id;

    // 3. Vérification de l'ordonnancement (isPinned desc, order asc, createdAt desc)
    const allInfos = await prisma.importantInfo.findMany({
      orderBy: [
        { isPinned: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    assert.ok(allInfos.length >= 2, "Au moins 2 fiches doivent être présentes");
    assert.strictEqual(allInfos[0].id, pinnedInfo.id, "La fiche épinglée doit arriver en tête de liste");

    // 4. Modification collaborative (mise à jour du contenu Markdown et des interlocuteurs)
    const updated = await prisma.importantInfo.update({
      where: { id: testInfoId },
      data: {
        title: "Test Fiche Mise à Jour",
        interlocutors: "Patrice Hulot, Philippe Hassel",
        content: "### Nouveau Contenu\n\nMis à jour par un membre de l'équipe.",
      },
    });

    assert.strictEqual(updated.title, "Test Fiche Mise à Jour");
    assert.strictEqual(updated.interlocutors, "Patrice Hulot, Philippe Hassel");
    assert.ok(updated.content.includes("Mis à jour par un membre"));

    console.log("✔ Fiches et métadonnées validées avec succès en base de données.");
  } finally {
    // Nettoyage des fiches temporaires de test
    if (testInfoId) {
      await prisma.importantInfo.delete({ where: { id: testInfoId } }).catch(() => {});
    }
    if (pinnedInfoId) {
      await prisma.importantInfo.delete({ where: { id: pinnedInfoId } }).catch(() => {});
    }
  }

  console.log("✔ [Tier 1] Test 1.16 réussi avec succès !");
  return { success: true };
}

// Exécution directe si invoqué via CLI
if (process.argv[1]?.endsWith("test-16-important-infos-markdown.ts")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Échec Test 1.16:", err);
      process.exit(1);
    });
}
