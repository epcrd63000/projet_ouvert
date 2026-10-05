import assert from "assert";
import { prisma } from "../../app/src/lib/prisma";
import { convertDecisionToTask } from "../../app/src/lib/meetings/decisionService";

/**
 * Test T1.11 : Conversion des Décisions de réunion en Tâches projet et Émargement (TDD).
 * Valide que :
 * 1. L'émargement individuel (PRESENT, EXCUSED, ABSENT) est persisté.
 * 2. Une décision de réunion peut être créée avec responsable et échéance.
 * 3. La conversion en tâche crée la tâche Kanban, l'assignation et lie bidirectionnellement la décision.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.11: Conversion Décision -> Tâche et Émargement...");

  try {
    const etienne = await prisma.user.findFirst({ where: { email: "etienne@imt.fr" } });
    const liam = await prisma.user.findFirst({ where: { email: "liam@imt.fr" } });
    const project = await prisma.project.findFirst();

    if (!etienne || !liam || !project) {
      throw new Error("Données de base manquantes (Etienne, Liam ou Projet)");
    }

    // 1. Créer une réunion de test (sans nested creates)
    const testMeeting = await prisma.meeting.create({
      data: {
        title: "Réunion TDD Test Conversion",
        scheduledAt: new Date("2026-10-15T14:00:00Z"),
        projectId: project.id,
        createdById: etienne.id,
        objectives: "Tester la conversion et l'émargement",
      },
    });

    const etienneAttendee = await prisma.meetingAttendee.create({
      data: { meetingId: testMeeting.id, userId: etienne.id, status: "PRESENT" },
    });

    const liamAttendee = await prisma.meetingAttendee.create({
      data: { meetingId: testMeeting.id, userId: liam.id, status: "PRESENT" },
    });
    assert.ok(liamAttendee, "Liam doit être dans la liste des participants");

    const updatedAttendee = await prisma.meetingAttendee.update({
      where: { id: liamAttendee.id },
      data: { status: "EXCUSED" },
    });
    assert.strictEqual(updatedAttendee.status, "EXCUSED", "Le statut d'émargement doit être EXCUSED");

    // 3. Créer une décision
    const testDueDate = new Date("2026-10-30T00:00:00Z");
    const decision = await prisma.meetingDecision.create({
      data: {
        meetingId: testMeeting.id,
        createdById: etienne.id,
        content: "Fabriquer le safran en composite carbone",
        assigneeId: liam.id,
        dueDate: testDueDate,
      },
    });

    assert.ok(decision.id, "La décision doit être créée");
    assert.strictEqual(decision.taskId, null, "La décision ne doit pas avoir de tâche liée au départ");

    // 4. Convertir la décision en tâche via le service dédié
    const conversionResult = await convertDecisionToTask(decision.id, etienne.id);
    assert.ok(conversionResult.success, "La conversion doit réussir");
    assert.ok(conversionResult.taskId, "Un ID de tâche doit être retourné");

    // 5. Vérifier la tâche créée
    const createdTask = await prisma.task.findUnique({
      where: { id: conversionResult.taskId },
      include: { assignments: true },
    });

    assert.ok(createdTask, "La tâche doit exister en base de données");
    assert.strictEqual(createdTask.title, "Fabriquer le safran en composite carbone");
    assert.ok(createdTask.tags.includes("Réunion"), "La tâche doit avoir le tag 'Réunion'");
    assert.strictEqual(createdTask.status, "TODO", "La tâche doit démarrer en statut TODO");
    assert.strictEqual(createdTask.assignments.length, 1, "La tâche doit avoir 1 assignation");
    assert.strictEqual(createdTask.assignments[0].userId, liam.id, "La tâche doit être assignée à Liam");

    // 6. Vérifier la liaison bidirectionnelle sur la décision
    const refreshedDecision = await prisma.meetingDecision.findUnique({
      where: { id: decision.id },
      include: { task: true },
    });

    assert.strictEqual(refreshedDecision?.taskId, createdTask.id, "La décision doit pointer vers la tâche créée");
    assert.strictEqual(refreshedDecision?.task?.title, createdTask.title);

    // 7. Nettoyage des données de test
    await prisma.task.delete({ where: { id: createdTask.id } });
    await prisma.meeting.delete({ where: { id: testMeeting.id } });

    console.log("✅ [Tier 1] Test 1.11 réussi : Conversion Décision -> Tâche et Émargement validés !");
  } catch (error) {
    console.error("❌ Échec Test 1.11:", error);
    throw error;
  }
}

if (process.argv[1]?.includes("test-11-decision-task-conversion")) {
  runTest()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
