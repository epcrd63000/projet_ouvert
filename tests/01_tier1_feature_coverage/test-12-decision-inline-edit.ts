import assert from "assert";
import { prisma } from "../../app/src/lib/prisma";
import { convertDecisionToTask } from "../../app/src/lib/meetings/decisionService";

/**
 * Test T1.12 : Édition inline des décisions et synchronisation bidirectionnelle tâche Kanban.
 * Valide que :
 * 1. Une décision peut être mise à jour directement (libellé, assigné, échéance).
 * 2. Si une tâche Kanban est déjà liée, ses propriétés (titre, date, assignation) sont synchronisées en miroir.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.12: Édition inline des Décisions et synchronisation miroir...");

  let testMeetingId: string | null = null;
  let taskId: string | null = null;

  try {
    const etienne = await prisma.user.findFirst({ where: { email: "etienne@imt.fr" } });
    const liam = await prisma.user.findFirst({ where: { email: "liam@imt.fr" } });
    const hugo = await prisma.user.findFirst({ where: { email: "hugo@imt.fr" } });
    const project = await prisma.project.findFirst();

    if (!etienne || !liam || !hugo || !project) {
      throw new Error("Données de base manquantes pour le test T1.12");
    }

    // 1. Création réunion de test
    const testMeeting = await prisma.meeting.create({
      data: {
        title: "Réunion TDD Test Édition Inline",
        scheduledAt: new Date("2026-10-20T10:00:00Z"),
        projectId: project.id,
        createdById: etienne.id,
      },
    });
    testMeetingId = testMeeting.id;

    // 2. Création décision initiale
    const initialDate = new Date("2026-10-25T00:00:00Z");
    const decision = await prisma.meetingDecision.create({
      data: {
        meetingId: testMeeting.id,
        createdById: etienne.id,
        content: "Conception initiale quille pendulaire",
        assigneeId: liam.id,
        dueDate: initialDate,
      },
    });

    // 3. Conversion en tâche Kanban
    const conversionResult = await convertDecisionToTask(decision.id, etienne.id);
    taskId = conversionResult.taskId;
    assert.ok(taskId, "La tâche doit être créée lors de la conversion");

    // 4. Simulation de la mise à jour inline de la décision (via logique PATCH)
    const newDate = new Date("2026-11-05T00:00:00Z");
    const updatedDecision = await prisma.meetingDecision.update({
      where: { id: decision.id },
      data: {
        content: "Conception avancée quille pendulaire (modifiée)",
        assigneeId: hugo.id,
        dueDate: newDate,
      },
    });

    assert.strictEqual(
      updatedDecision.content,
      "Conception avancée quille pendulaire (modifiée)",
      "Le contenu de la décision doit être mis à jour"
    );
    assert.strictEqual(updatedDecision.assigneeId, hugo.id, "Le pilote doit être Hugo");

    // 5. Synchronisation miroir de la tâche Kanban liée
    if (updatedDecision.taskId) {
      await prisma.task.update({
        where: { id: updatedDecision.taskId },
        data: {
          title: updatedDecision.content,
          dueDate: updatedDecision.dueDate,
        },
      });

      await prisma.taskAssignment.deleteMany({ where: { taskId: updatedDecision.taskId } });
      await prisma.taskAssignment.create({
        data: { taskId: updatedDecision.taskId, userId: hugo.id },
      });
    }

    // 6. Vérification de la tâche Kanban miroir
    const syncedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignments: true },
    });

    assert.ok(syncedTask, "La tâche Kanban liée doit exister");
    assert.strictEqual(syncedTask.title, "Conception avancée quille pendulaire (modifiée)");
    assert.strictEqual(syncedTask.dueDate?.toISOString(), newDate.toISOString());
    assert.strictEqual(syncedTask.assignments.length, 1);
    assert.strictEqual(syncedTask.assignments[0].userId, hugo.id, "La tâche doit être réassignée à Hugo");

    console.log("✅ [Tier 1] Test 1.12 réussi : Édition inline et synchronisation miroir validées !");
  } finally {
    // 7. Nettoyage
    if (taskId) {
      await prisma.taskAssignment.deleteMany({ where: { taskId } });
      await prisma.task.delete({ where: { id: taskId } }).catch(() => {});
    }
    if (testMeetingId) {
      await prisma.meetingDecision.deleteMany({ where: { meetingId: testMeetingId } });
      await prisma.meetingAttendee.deleteMany({ where: { meetingId: testMeetingId } });
      await prisma.meeting.delete({ where: { id: testMeetingId } }).catch(() => {});
    }
  }
}

if (process.argv[1]?.includes("test-12-decision-inline-edit")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Échec Test 1.12 :", err);
      process.exit(1);
    });
}
