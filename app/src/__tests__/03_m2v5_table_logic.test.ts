/**
 * Tests unitaires TDD pour la logique métier du tableau M2V5 (IMT Projet Ouvert).
 */

import {
  computeSyncStatusAndProgress,
  isTaskOverdue,
  canUserEditTask,
  generateM2V5ClipboardTsv,
  TaskItemM2V5,
} from "../lib/m2v5/m2v5Logic";

function runM2V5LogicTests() {
  console.log("🧪 Lancement des tests unitaires de la logique M2V5...");

  const now = new Date("2026-10-05T12:00:00Z");

  // 1. Tests de synchronisation bidirectionnelle % Avancement et Statut
  // 1.1 Quand le progrès passe à 100%, statut devient DONE
  const res1 = computeSyncStatusAndProgress({ status: "IN_PROGRESS", progress: 60 }, { progress: 100 });
  console.assert(res1.status === "DONE" && res1.progress === 100, "100% doit donner DONE");

  // 1.2 Quand le statut passe à DONE, progrès devient 100%
  const res2 = computeSyncStatusAndProgress({ status: "IN_PROGRESS", progress: 40 }, { status: "DONE" });
  console.assert(res2.status === "DONE" && res2.progress === 100, "DONE doit forcer 100%");

  // 1.3 Quand le progrès passe de 0 à 50%, statut TODO bascule en IN_PROGRESS
  const res3 = computeSyncStatusAndProgress({ status: "TODO", progress: 0 }, { progress: 50 });
  console.assert(res3.status === "IN_PROGRESS" && res3.progress === 50, "50% doit basculer en IN_PROGRESS");

  // 1.4 Si statut est BLOCKED et qu'on modifie le progrès (ex: 30%), statut reste BLOCKED
  const res4 = computeSyncStatusAndProgress({ status: "BLOCKED", progress: 20 }, { progress: 30 });
  console.assert(res4.status === "BLOCKED" && res4.progress === 30, "BLOCKED doit rester BLOCKED");

  // 1.5 Si statut passe à TODO depuis 100%, progrès repasse à 0%
  const res5 = computeSyncStatusAndProgress({ status: "DONE", progress: 100 }, { status: "TODO" });
  console.assert(res5.status === "TODO" && res5.progress === 0, "TODO depuis 100% doit repasser à 0%");
  console.log("  ✅ Synchronisation % / Statut validée");

  // 2. Tests de calcul de retard automatique
  const taskPastDue: TaskItemM2V5 = {
    id: "t-late",
    title: "Tâche en retard",
    status: "IN_PROGRESS",
    progress: 70,
    dueDate: new Date("2026-10-01T00:00:00Z"), // Passé
    assignments: [],
  };
  console.assert(isTaskOverdue(taskPastDue, now) === true, "Tâche passée non achevée doit être en retard");

  const taskDoneOnTime: TaskItemM2V5 = {
    id: "t-done",
    title: "Tâche terminée",
    status: "DONE",
    progress: 100,
    dueDate: new Date("2026-10-01T00:00:00Z"), // Passé mais terminée
    assignments: [],
  };
  console.assert(isTaskOverdue(taskDoneOnTime, now) === false, "Tâche terminée ne doit pas être en retard");

  const taskFuture: TaskItemM2V5 = {
    id: "t-future",
    title: "Tâche future",
    status: "TODO",
    progress: 0,
    dueDate: new Date("2026-10-15T00:00:00Z"), // Futur
    assignments: [],
  };
  console.assert(isTaskOverdue(taskFuture, now) === false, "Tâche future ne doit pas être en retard");
  console.log("  ✅ Détection automatique de retard validée");

  // 3. Tests des permissions d'édition
  const user1 = "user-1";
  const user2 = "user-2";
  const adminUser = "admin-1";

  const taskOfUser1: TaskItemM2V5 = {
    id: "t-u1",
    title: "Tâche créateur 1",
    status: "TODO",
    progress: 0,
    createdById: user1,
    assignments: [{ user: { id: user1, name: "User 1" } }],
  };

  console.assert(canUserEditTask(taskOfUser1, user1, false) === true, "Le créateur / assigné doit pouvoir éditer");
  console.assert(canUserEditTask(taskOfUser1, user2, false) === false, "Un autre membre ne doit pas pouvoir éditer");
  console.assert(canUserEditTask(taskOfUser1, user2, true) === true, "L'administrateur doit toujours pouvoir éditer");
  console.log("  ✅ Règles de permissions d'édition validées");

  // 4. Test du générateur TSV pour presse-papier
  const tsv = generateM2V5ClipboardTsv([taskPastDue, taskDoneOnTime]);
  console.assert(tsv.includes("Tâche\tPilote\tÉchéance"), "L'en-tête TSV doit être présent");
  console.assert(tsv.includes("Tâche en retard"), "La tâche doit être dans le TSV");
  console.assert(tsv.includes("70%"), "Le pourcentage doit être formaté dans le TSV");
  console.log("  ✅ Export TSV pour presse-papier validé");

  console.log("🎉 Tous les tests unitaires M2V5 sont passés avec succès !\n");
}

runM2V5LogicTests();
