import assert from "assert";
import { prisma } from "../../app/src/lib/prisma";
import { parseAiMeetingReport } from "../../app/src/lib/meetings/aiReportParser";
import { convertDecisionToTask } from "../../app/src/lib/meetings/decisionService";

/**
 * Test T1.13 : Scénario utilisateur réel de bout en bout (E2E).
 * Valide :
 * 1. Le parsing du format exact retourné par l'IA (pasted text).
 * 2. La mise à jour non destructive en mode Neon HTTP (sans transaction interactive).
 * 3. La création des 5 décisions avec pilotes et dates.
 * 4. La mise à jour d'émargement (EXCUSED, ABSENT, PRESENT).
 * 5. La conversion d'une décision en tâche Kanban.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.13: Scénario utilisateur complet (IA, Émargement, Décisions)...");

  const users = await prisma.user.findMany();
  const project = await prisma.project.findFirst();
  assert.ok(project, "Le projet doit exister");
  assert.ok(users.length >= 4, "Au moins 4 utilisateurs doivent exister");

  const rawAiText = `[OBJECTIFS]

* Valider la V2 du cahier des charges et la conformité à la jauge MINIMOCA.
* Faire la revue de conception (CAO) de la coque et du plan de voilure.
* Planifier les achats matériels et les créneaux de fabrication au Fablab pour la semaine à venir.
[/OBJECTIFS]

[SYNTHESE]

### Points abordés

* Validation finale du cahier des charges (Jauge MINIMOCA).
* Avancement de la CAO de la coque sous SolidWorks.
* Dimensionnement de la voilure et création des patrons.
* Sélection des composants mécatroniques et validation du budget.
* Planification des usinages au Fablab et préparation de la soutenance (Pecha Kucha).

### Déroulé

La réunion a débuté par un point d'étape d'Etienne sur les objectifs de la semaine. Liam a confirmé que le cahier des charges V2 est quasi finalisé et respecte les contraintes de jauge ; il ne manque que l'approbation du tuteur. Sur la partie mécanique, Hugo a présenté l'avancement de la coque sur SolidWorks et a sollicité l'aide de Solal pour le placement des éléments internes (puits de dérive, servo treuil).

### Résumé technique

* **Jauge MINIMOCA :** Longueur maximale de 80 cm, tirant d'air de 1,10 m, et masse du bulbe de quille inférieure à 1,8 kg.
[/SYNTHESE]

[DECISIONS]

* [Liam] [09/10/2026] Faire signer la convention de projet par M. Laurent (tuteur)
* [Hugo] [11/10/2026] Exporter et transmettre les fichiers DXF propres des couples pour la découpe laser
* [Liam] [12/10/2026] Passer la commande officielle pour l'électronique, les résines et le carbone
* [Peter] [13/10/2026] Réaliser la découpe laser des couples en contreplaqué 4mm au Fablab
* [Solal] [14/10/2026] Finaliser et sortir les patrons de découpe 2D de la voilure sur Illustrator
[/DECISIONS]`;

  // 1. Parsing
  const parsed = parseAiMeetingReport(rawAiText, users);
  assert.ok(parsed.objectives.includes("Valider la V2 du cahier des charges"), "Objectifs parsés");
  assert.ok(parsed.synthesis.includes("Points abordés"), "Synthèse parsée");
  assert.strictEqual(parsed.decisions.length, 5, "5 décisions doivent être extraites");

  // Vérifier assignation
  const liamDecision = parsed.decisions[0];
  const liamUser = users.find((u) => u.name.toLowerCase().includes("liam"));
  assert.strictEqual(liamDecision.assigneeId, liamUser?.id, "Liam doit être assigné");
  assert.strictEqual(liamDecision.dueDate, "2026-10-09", "Date ISO 2026-10-09");

  // 2. Création d'une réunion de test
  const meeting = await prisma.meeting.create({
    data: {
      title: "Point Hebdo Test Validation E2E",
      scheduledAt: new Date("2026-10-05T14:00:00Z"),
      projectId: project.id,
      createdById: users[0].id,
    },
  });

  try {
    // 3. Mise à jour des objectifs et de la synthèse (mode Neon HTTP vérifié)
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        objectives: parsed.objectives,
        reportContent: parsed.synthesis,
      },
    });

    const updatedMeeting = await prisma.meeting.findUnique({
      where: { id: meeting.id },
    });
    assert.strictEqual(updatedMeeting?.objectives, parsed.objectives, "Objectifs enregistrés en BDD");
    assert.strictEqual(updatedMeeting?.reportContent, parsed.synthesis, "Synthèse enregistrée en BDD");

    // 4. Émargement : ajout d'un participant et modification de son statut
    const attendee = await prisma.meetingAttendee.create({
      data: {
        meetingId: meeting.id,
        userId: users[0].id,
        status: "PRESENT",
      },
    });

    // Passer à EXCUSED
    await prisma.meetingAttendee.update({
      where: { id: attendee.id },
      data: { status: "EXCUSED" },
    });
    let refetchedAttendee = await prisma.meetingAttendee.findUnique({ where: { id: attendee.id } });
    assert.strictEqual(refetchedAttendee?.status, "EXCUSED", "Statut doit être EXCUSED");

    // Passer à ABSENT
    await prisma.meetingAttendee.update({
      where: { id: attendee.id },
      data: { status: "ABSENT" },
    });
    refetchedAttendee = await prisma.meetingAttendee.findUnique({ where: { id: attendee.id } });
    assert.strictEqual(refetchedAttendee?.status, "ABSENT", "Statut doit être ABSENT");

    // 5. Création des 5 décisions
    const createdDecisions = [];
    for (const dec of parsed.decisions) {
      const created = await prisma.meetingDecision.create({
        data: {
          meetingId: meeting.id,
          createdById: users[0].id,
          content: dec.content,
          assigneeId: dec.assigneeId,
          dueDate: dec.dueDate ? new Date(dec.dueDate) : null,
        },
      });
      createdDecisions.push(created);
    }
    assert.strictEqual(createdDecisions.length, 5, "5 décisions insérées en BDD");

    // 6. Conversion de la 1ère décision en tâche
    const convResult = await convertDecisionToTask(createdDecisions[0].id, users[0].id);
    assert.strictEqual(convResult.success, true, "Conversion doit réussir");

    const linkedTask = await prisma.task.findUnique({ where: { id: convResult.taskId } });
    assert.ok(linkedTask, "La tâche créée doit exister");
    assert.strictEqual(linkedTask?.title, createdDecisions[0].content, "Titre de tâche = contenu décision");

    // 7. Nettoyage de la tâche
    await prisma.taskAssignment.deleteMany({ where: { taskId: linkedTask.id } });
    await prisma.meetingDecision.update({ where: { id: createdDecisions[0].id }, data: { taskId: null } });
    await prisma.task.delete({ where: { id: linkedTask.id } });

    console.log("✅ [Tier 1] Test 1.13 réussi : Scénario utilisateur 100% validé !");
  } finally {
    // Nettoyage réunion de test
    await prisma.meetingDecision.deleteMany({ where: { meetingId: meeting.id } });
    await prisma.meetingAttendee.deleteMany({ where: { meetingId: meeting.id } });
    await prisma.meeting.delete({ where: { id: meeting.id } });
  }
}

if (process.argv[1]?.includes("test-13-user-scenario-e2e")) {
  runTest().catch((err) => {
    console.error("❌ Échec Test 1.13:", err);
    process.exit(1);
  });
}
