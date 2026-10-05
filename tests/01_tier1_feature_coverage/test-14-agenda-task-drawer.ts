import assert from "assert";
import { prisma } from "../../app/src/lib/prisma";

/**
 * Test T1.14 : Validation des données et du cycle de vie des tâches pour le volet latéral de l'Agenda.
 * Valide que :
 * 1. Les tâches disposent bien de tous les attributs requis pour l'affichage riche (priorité, échéance, assignations, livrables IMT).
 * 2. La distinction entre tâches personnelles et tâches globales de l'équipe fonctionne pour n'importe quel membre.
 * 3. La mise à jour rapide du statut d'une tâche (ex: TODO -> IN_PROGRESS -> DONE) persiste correctement avec calcul d'avancement.
 * Note : Compatible Neon HTTP mode (pas de nested writes).
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.14: Validation des tâches et du volet latéral de l'Agenda...");

  let testTaskId: string | null = null;

  try {
    const etienne = await prisma.user.findFirst({ where: { email: "etienne@imt.fr" } });
    const hugo = await prisma.user.findFirst({ where: { email: "hugo@imt.fr" } });
    const project = await prisma.project.findFirst();

    if (!etienne || !hugo || !project) {
      throw new Error("Données de base manquantes pour le test T1.14 (utilisateurs ou projet)");
    }

    // 1. Création d'une tâche de test avec métadonnées IMT et dueDate (sans nested write)
    const dueDate = new Date("2026-10-28T14:00:00Z");
    const createdTask = await prisma.task.create({
      data: {
        title: "Tâche Test Volet Agenda TDD",
        description: "Vérification des champs complets pour le volet latéral",
        status: "TODO",
        priority: "HIGH",
        position: 999,
        dueDate,
        workload: "3h",
        deliverables: "Spécification validée",
        validationCriteria: "Revue par les pairs",
        progress: 0,
        projectId: project.id,
        createdById: etienne.id,
      },
    });
    testTaskId = createdTask.id;

    // Création de l'assignation séparée (Neon HTTP safe)
    await prisma.taskAssignment.create({
      data: {
        taskId: createdTask.id,
        userId: etienne.id,
      },
    });

    const taskWithAssignments = await prisma.task.findUnique({
      where: { id: createdTask.id },
      include: {
        assignments: { include: { user: true } },
      },
    });

    assert.ok(taskWithAssignments, "La tâche doit exister");
    assert.strictEqual(taskWithAssignments.priority, "HIGH", "La priorité doit être HIGH");
    assert.strictEqual(taskWithAssignments.workload, "3h", "La charge de travail doit être 3h");
    assert.strictEqual(taskWithAssignments.assignments.length, 1, "La tâche doit avoir un assigné");

    // 2. Test logique de distinction "Perso vs Équipe"
    const isMineForEtienne = taskWithAssignments.assignments.some((a) => a.userId === etienne.id) || taskWithAssignments.createdById === etienne.id;
    const isMineForHugo = taskWithAssignments.assignments.some((a) => a.userId === hugo.id) || taskWithAssignments.createdById === hugo.id;

    assert.strictEqual(isMineForEtienne, true, "La tâche doit être reconnue comme personnelle pour Etienne");
    assert.strictEqual(isMineForHugo, false, "La tâche doit être reconnue comme globale/équipe pour Hugo");

    // 3. Test de mise à jour rapide du statut (TODO -> IN_PROGRESS -> DONE)
    const updatedToInProgress = await prisma.task.update({
      where: { id: testTaskId },
      data: { status: "IN_PROGRESS", progress: 50 },
    });
    assert.strictEqual(updatedToInProgress.status, "IN_PROGRESS", "Le statut doit être mis à jour à IN_PROGRESS");
    assert.strictEqual(updatedToInProgress.progress, 50, "La progression doit être à 50%");

    const updatedToDone = await prisma.task.update({
      where: { id: testTaskId },
      data: { status: "DONE", progress: 100, completedAt: new Date() },
    });
    assert.strictEqual(updatedToDone.status, "DONE", "Le statut doit être mis à jour à DONE");
    assert.strictEqual(updatedToDone.progress, 100, "La progression doit être à 100%");
    assert.ok(updatedToDone.completedAt, "completedAt doit être renseigné");

    console.log("✅ [Tier 1] Test 1.14 réussi : Métadonnées, distinction perso/équipe et mise à jour validées !");
  } finally {
    // Nettoyage de la tâche créée pour le test
    if (testTaskId) {
      await prisma.taskAssignment.deleteMany({ where: { taskId: testTaskId } }).catch(() => {});
      await prisma.task.delete({ where: { id: testTaskId } }).catch(() => {});
    }
  }
}
