/**
 * Tests unitaires TDD pour la gestion du statut individuel d'assignation,
 * du statut consolidé d'équipe et de la suppression intelligente.
 */

import {
  computeCollectiveTaskStatus,
  getEffectiveUserTaskStatus,
  determineTaskDeletionAction,
  TaskCollectiveEntity,
} from "../lib/tasks/collectiveTaskLogic";

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Échec du test : ${message}`);
  }
}

function runCollectiveTaskStatusTests() {
  console.log("🧪 Lancement des tests TDD pour le statut collectif et la suppression intelligente...");

  // =========================================================================
  // 1. Tests de calcul du statut collectif (Règle d'équipe stricte)
  // =========================================================================
  console.log("  1. Test computeCollectiveTaskStatus...");

  // Cas 1.1 : Tous les membres sont TODO -> Tâche TODO
  const statusAllTodo = computeCollectiveTaskStatus([
    { userId: "u1", status: "TODO" },
    { userId: "u2", status: "TODO" },
  ]);
  assertTrue(statusAllTodo === "TODO", "Tous en TODO doit donner TODO");

  // Cas 1.2 : Un membre passe IN_PROGRESS et l'autre est TODO -> Tâche IN_PROGRESS
  const statusOneProgress = computeCollectiveTaskStatus([
    { userId: "u1", status: "IN_PROGRESS" },
    { userId: "u2", status: "TODO" },
  ]);
  assertTrue(statusOneProgress === "IN_PROGRESS", "Un membre en IN_PROGRESS doit passer la tâche en IN_PROGRESS");

  // Cas 1.3 : Un membre a terminé DONE mais l'autre est encore TODO -> Tâche encore IN_PROGRESS
  const statusOneDoneOneTodo = computeCollectiveTaskStatus([
    { userId: "u1", status: "DONE" },
    { userId: "u2", status: "TODO" },
  ]);
  assertTrue(statusOneDoneOneTodo === "IN_PROGRESS", "Mix DONE et TODO doit laisser la tâche globale en IN_PROGRESS");

  // Cas 1.4 : TOUS les membres ont validé DONE -> Tâche DONE
  const statusAllDone = computeCollectiveTaskStatus([
    { userId: "u1", status: "DONE" },
    { userId: "u2", status: "DONE" },
    { userId: "u3", status: "DONE" },
  ]);
  assertTrue(statusAllDone === "DONE", "Tous en DONE doit passer la tâche globale en DONE");

  // Cas 1.5 : Au moins un membre est BLOCKED -> Tâche BLOCKED
  const statusOneBlocked = computeCollectiveTaskStatus([
    { userId: "u1", status: "DONE" },
    { userId: "u2", status: "BLOCKED" },
  ]);
  assertTrue(statusOneBlocked === "BLOCKED", "Au moins un membre BLOCKED doit afficher la tâche BLOCKED");

  // Cas 1.6 : Tâche sans assigné -> Fallback
  const statusNoAssignees = computeCollectiveTaskStatus([], "TODO");
  assertTrue(statusNoAssignees === "TODO", "Sans assigné, le fallback doit être respecté");

  console.log("     ✓ Calcul du statut d'équipe validé avec succès.");

  // =========================================================================
  // 2. Tests du statut effectif pour un utilisateur donné (Mes tâches vs Global)
  // =========================================================================
  console.log("  2. Test getEffectiveUserTaskStatus...");

  const sharedTask: TaskCollectiveEntity = {
    id: "task-shared",
    status: "IN_PROGRESS", // Globalement en cours
    assignments: [
      { userId: "u1", status: "IN_PROGRESS" }, // Étienne est en cours
      { userId: "u2", status: "TODO" },        // Hugo est à faire
      { userId: "u3", status: "DONE" },        // Liam a terminé sa part
    ],
  };

  assertTrue(
    getEffectiveUserTaskStatus(sharedTask, "u1") === "IN_PROGRESS",
    "Pour u1, le statut effectif doit être IN_PROGRESS"
  );
  assertTrue(
    getEffectiveUserTaskStatus(sharedTask, "u2") === "TODO",
    "Pour u2, le statut effectif doit être TODO"
  );
  assertTrue(
    getEffectiveUserTaskStatus(sharedTask, "u3") === "DONE",
    "Pour u3, le statut effectif doit être DONE"
  );
  // Utilisateur tiers non assigné -> voit le statut global
  assertTrue(
    getEffectiveUserTaskStatus(sharedTask, "u99") === "IN_PROGRESS",
    "Un utilisateur non assigné voit le statut global"
  );

  console.log("     ✓ Statut effectif individuel validé avec succès.");

  // =========================================================================
  // 3. Tests de suppression vs désassignation intelligente
  // =========================================================================
  console.log("  3. Test determineTaskDeletionAction...");

  const multiTask: TaskCollectiveEntity = {
    id: "multi-task",
    status: "IN_PROGRESS",
    assignments: [
      { userId: "u1", status: "IN_PROGRESS" },
      { userId: "u2", status: "TODO" },
    ],
  };

  const soloTask: TaskCollectiveEntity = {
    id: "solo-task",
    status: "TODO",
    assignments: [{ userId: "u1", status: "TODO" }],
  };

  // 3.1 Membre standard sur tâche partagée -> UNASSIGN
  const decisionMemberMulti = determineTaskDeletionAction(multiTask, "u1", false);
  assertTrue(
    decisionMemberMulti.action === "UNASSIGN" && decisionMemberMulti.targetUserId === "u1",
    "Membre sur tâche partagée doit être uniquement désassigné"
  );

  // 3.2 Membre standard sur tâche solo -> DELETE
  const decisionMemberSolo = determineTaskDeletionAction(soloTask, "u1", false);
  assertTrue(
    decisionMemberSolo.action === "DELETE",
    "Membre sur tâche solo doit supprimer la tâche entièrement"
  );

  // 3.3 Admin demandant explicitement "delete" sur tâche partagée -> DELETE
  const decisionAdminExplicitDelete = determineTaskDeletionAction(multiTask, "admin-1", true, "delete");
  assertTrue(
    decisionAdminExplicitDelete.action === "DELETE",
    "Admin avec action 'delete' doit supprimer la tâche pour tous"
  );

  // 3.4 Admin demandant explicitement "unassign" sur tâche partagée -> UNASSIGN
  const decisionAdminExplicitUnassign = determineTaskDeletionAction(multiTask, "admin-1", true, "unassign");
  assertTrue(
    decisionAdminExplicitUnassign.action === "UNASSIGN",
    "Admin avec action 'unassign' doit se retirer uniquement"
  );

  console.log("     ✓ Règles de désassignation et suppression validées avec succès.");
  console.log("🎉 Tous les tests TDD pour le statut collectif et la suppression intelligente ont réussi !");
}

runCollectiveTaskStatusTests();
