/**
 * Tests unitaires TDD pour les permissions d'édition et le filtrage de périmètre des tâches.
 * Valide les exigences IMT :
 * 1. Modification autorisée pour le propriétaire et les binômes (tâches en commun).
 * 2. Refus de modification pour les tâches tierces des autres membres.
 * 3. Vue "Mes tâches" étanche même pour l'administrateur (ne renvoie pas toutes les tâches).
 */

import { canUserEditTask, filterTasksByScope } from "../lib/tasks/taskScopeLogic";

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Échec du test : ${message}`);
  }
}

function runTaskPermissionsAndScopeTests() {
  console.log("🧪 Lancement des tests TDD pour les permissions d'édition et le périmètre des tâches...");

  const adminUserId = "admin-etienne";
  const memberHugoId = "member-hugo";
  const memberSolalId = "member-solal";
  const memberPeterId = "member-peter";

  // Définition de jeux de données de test
  const taskHugoSolo = {
    id: "task-1",
    title: "DXF des couples",
    createdById: adminUserId,
    assignments: [{ user: { id: memberHugoId, name: "Hugo RAMPAZZO" } }],
  };

  const taskSharedHugoSolal = {
    id: "task-2",
    title: "Conception voilure en binôme",
    createdById: memberHugoId,
    assignments: [
      { user: { id: memberHugoId, name: "Hugo RAMPAZZO" } },
      { user: { id: memberSolalId, name: "Solal BENQADI" } },
    ],
  };

  const taskPeterSolo = {
    id: "task-3",
    title: "Usinage membrures Fablab",
    createdById: memberPeterId,
    assignments: [{ user: { id: memberPeterId, name: "Peter BATLLO" } }],
  };

  const taskAdminSolo = {
    id: "task-4",
    title: "Revue cahier des charges S2",
    createdById: adminUserId,
    assignments: [{ user: { id: adminUserId, name: "Etienne PICARD" } }],
  };

  const taskSharedAdminLiam = {
    id: "task-5",
    title: "Signature convention de projet",
    createdById: adminUserId,
    assignments: [
      { user: { id: adminUserId, name: "Etienne PICARD" } },
      { user: { id: "admin-liam", name: "Liam BEAN" } },
    ],
  };

  const allTasks = [
    taskHugoSolo,
    taskSharedHugoSolal,
    taskPeterSolo,
    taskAdminSolo,
    taskSharedAdminLiam,
  ];

  // =========================================================================
  // 1. Tests des permissions d'édition (Tâche propre ou en commun)
  // =========================================================================
  console.log("  1. Test canUserEditTask (propriétaire, binôme et tiers)...");

  // Hugo peut modifier sa tâche solo
  assertTrue(
    canUserEditTask(taskHugoSolo, memberHugoId, false) === true,
    "Hugo doit pouvoir modifier sa tâche solo"
  );

  // Hugo et Solal peuvent TOUS LES DEUX modifier leur tâche partagée en binôme
  assertTrue(
    canUserEditTask(taskSharedHugoSolal, memberHugoId, false) === true,
    "Hugo doit pouvoir modifier la tâche en commun avec Solal"
  );
  assertTrue(
    canUserEditTask(taskSharedHugoSolal, memberSolalId, false) === true,
    "Solal doit pouvoir modifier la tâche en commun avec Hugo"
  );

  // Peter (membre non assigné et non créateur) NE PEUT PAS modifier la tâche d'Hugo
  assertTrue(
    canUserEditTask(taskHugoSolo, memberPeterId, false) === false,
    "Peter ne doit pas pouvoir modifier la tâche d'Hugo"
  );

  // Peter NE PEUT PAS modifier la tâche commune de Hugo et Solal
  assertTrue(
    canUserEditTask(taskSharedHugoSolal, memberPeterId, false) === false,
    "Peter ne doit pas pouvoir modifier la tâche partagée Hugo/Solal"
  );

  // L'administrateur peut TOUT modifier
  assertTrue(
    canUserEditTask(taskHugoSolo, adminUserId, true) === true,
    "L'administrateur doit pouvoir modifier n'importe quelle tâche"
  );
  assertTrue(
    canUserEditTask(taskPeterSolo, adminUserId, true) === true,
    "L'administrateur doit pouvoir modifier la tâche de Peter"
  );

  // Sans utilisateur connecté, aucune modification possible
  assertTrue(
    canUserEditTask(taskHugoSolo, "", false) === false,
    "Un utilisateur non identifié ne peut rien modifier"
  );

  console.log("     ✓ Permissions d'édition validées avec succès.");

  // =========================================================================
  // 2. Tests de filtrage de périmètre ('Mes tâches' vs 'Toutes les tâches')
  // =========================================================================
  console.log("  2. Test filterTasksByScope ('Mes tâches' vs 'Vue globale')...");

  // Vue globale : renvoie l'intégralité des 5 tâches
  const globalTasksHugo = filterTasksByScope(allTasks, memberHugoId, true);
  assertTrue(
    globalTasksHugo.length === 5,
    `La vue globale doit renvoyer toutes les tâches (5), reçu: ${globalTasksHugo.length}`
  );

  // Vue 'Mes tâches' pour Hugo : doit contenir sa tâche solo + la tâche commune avec Solal (2 tâches au total)
  const myTasksHugo = filterTasksByScope(allTasks, memberHugoId, false);
  assertTrue(
    myTasksHugo.length === 2,
    `'Mes tâches' pour Hugo doit renvoyer 2 tâches, reçu: ${myTasksHugo.length}`
  );
  assertTrue(
    myTasksHugo.some((t) => t.id === "task-1") && myTasksHugo.some((t) => t.id === "task-2"),
    "Hugo doit voir sa tâche solo et sa tâche en binôme"
  );
  assertTrue(
    !myTasksHugo.some((t) => t.id === "task-3"),
    "Hugo ne doit pas voir la tâche solo de Peter"
  );

  // Vue 'Mes tâches' pour l'ADMIN : ne doit PAS renvoyer tout le monde !
  // Il doit voir uniquement task-4 (solo) et task-5 (partagée avec Liam) = 2 tâches
  const myTasksAdmin = filterTasksByScope(allTasks, adminUserId, false);
  assertTrue(
    myTasksAdmin.length === 2,
    `'Mes tâches' pour l'admin doit renvoyer uniquement ses 2 tâches, reçu: ${myTasksAdmin.length}`
  );
  assertTrue(
    myTasksAdmin.some((t) => t.id === "task-4") && myTasksAdmin.some((t) => t.id === "task-5"),
    "L'admin doit voir sa tâche solo et sa tâche partagée avec Liam"
  );
  assertTrue(
    !myTasksAdmin.some((t) => t.id === "task-1") && !myTasksAdmin.some((t) => t.id === "task-3"),
    "L'admin ne doit pas voir les tâches des autres membres dans 'Mes tâches'"
  );

  // Vue 'Mes tâches' sans identifiant : doit renvoyer une liste vide sécurisée
  const emptyScopeTasks = filterTasksByScope(allTasks, "", false);
  assertTrue(
    emptyScopeTasks.length === 0,
    "Sans identifiant, 'Mes tâches' doit retourner une liste vide pour éviter toute fuite"
  );

  console.log("     ✓ Filtrage de périmètre 'Mes tâches' et 'Vue globale' validé.");
  console.log("🎉 Tous les tests TDD de permissions et périmètre ont réussi avec succès !");
}

runTaskPermissionsAndScopeTests();
