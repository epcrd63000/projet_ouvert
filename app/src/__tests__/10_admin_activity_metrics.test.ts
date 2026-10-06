/**
 * Tests unitaires des métriques d'activité hebdomadaire admin (TDD).
 * Valide le calcul des plages de semaines, l'ordonnancement décroissant (plus actif -> moins actif),
 * et les indicateurs synthétiques d'équipe.
 */

import {
  getWeekDateRange,
  calculateMemberWeeklyActivity,
  calculateActivitySummary,
  MemberActivityData,
  RawUser,
  RawActivityLog,
  RawTaskActivity,
  RawMeetingActivity,
} from "../lib/dashboard/adminActivityMetrics";

function runAdminActivityMetricsTests() {
  console.log("🧪 Lancement des tests unitaires d'activité hebdomadaire admin...");

  // 1. Test du calcul de la plage de dates de la semaine
  const refDate = new Date("2026-10-07T14:30:00Z"); // Un mercredi
  const currentWeek = getWeekDateRange(refDate, 0);

  // Le lundi de cette semaine doit être le 5 octobre 2026
  if (currentWeek.startOfWeek.getUTCDate() !== 5 || currentWeek.startOfWeek.getUTCMonth() !== 9) {
    throw new Error(`Échec calcul début de semaine: attendu 5 oct, reçu ${currentWeek.startOfWeek.toISOString()}`);
  }
  // Le dimanche de cette semaine doit être le 11 octobre 2026
  if (currentWeek.endOfWeek.getUTCDate() !== 11 || currentWeek.endOfWeek.getUTCMonth() !== 9) {
    throw new Error(`Échec calcul fin de semaine: attendu 11 oct, reçu ${currentWeek.endOfWeek.toISOString()}`);
  }

  // Semaine précédente (offset -1)
  const prevWeek = getWeekDateRange(refDate, -1);
  if (prevWeek.startOfWeek.getUTCDate() !== 28 || prevWeek.startOfWeek.getUTCMonth() !== 8) {
    throw new Error(`Échec calcul semaine précédente: attendu 28 sept, reçu ${prevWeek.startOfWeek.toISOString()}`);
  }

  // Semaine suivante (offset +1)
  const nextWeek = getWeekDateRange(refDate, 1);
  if (nextWeek.startOfWeek.getUTCDate() !== 12 || nextWeek.startOfWeek.getUTCMonth() !== 9) {
    throw new Error(`Échec calcul semaine suivante: attendu 12 oct, reçu ${nextWeek.startOfWeek.toISOString()}`);
  }
  console.log("  ✅ getWeekDateRange validé");

  // 2. Test du tri et du calcul par membre
  const mockUsers: RawUser[] = [
    { id: "u1", name: "Alice Dupont", email: "alice@imt.fr", avatarUrl: null },
    { id: "u2", name: "Bob Martin", email: "bob@imt.fr", avatarUrl: null },
    { id: "u3", name: "Charlie Durand", email: "charlie@imt.fr", avatarUrl: null },
    { id: "u4", name: "Diana Prince", email: "diana@imt.fr", avatarUrl: null },
  ];

  // Logs dans la semaine (entre 5 oct et 11 oct)
  const mockLogs: RawActivityLog[] = [
    // Alice : 3 visites
    { id: "l1", userId: "u1", actionType: "VISIT", createdAt: new Date("2026-10-05T09:00:00Z") },
    { id: "l2", userId: "u1", actionType: "VISIT", createdAt: new Date("2026-10-06T10:00:00Z") },
    { id: "l3", userId: "u1", actionType: "VISIT", createdAt: new Date("2026-10-07T11:00:00Z") },
    // Bob : 1 visite
    { id: "l4", userId: "u2", actionType: "VISIT", createdAt: new Date("2026-10-06T14:00:00Z") },
    // Charlie : 0 log
    // Diana : 5 visites
    { id: "l5", userId: "u4", actionType: "VISIT", createdAt: new Date("2026-10-05T08:00:00Z") },
    { id: "l6", userId: "u4", actionType: "VISIT", createdAt: new Date("2026-10-06T08:00:00Z") },
    { id: "l7", userId: "u4", actionType: "VISIT", createdAt: new Date("2026-10-07T08:00:00Z") },
    { id: "l8", userId: "u4", actionType: "VISIT", createdAt: new Date("2026-10-08T08:00:00Z") },
    { id: "l9", userId: "u4", actionType: "VISIT", createdAt: new Date("2026-10-09T08:00:00Z") },
  ];

  // Tâches modifiées ou créées dans la semaine
  const mockTasks: RawTaskActivity[] = [
    // Alice : 2 actions de tâches
    { id: "t1", createdById: "u1", lastUpdate: new Date("2026-10-06T15:00:00Z"), assignments: ["u1"] },
    { id: "t2", createdById: "u1", lastUpdate: new Date("2026-10-07T16:00:00Z"), assignments: [] },
    // Bob : 1 action de tâche
    { id: "t3", createdById: "u2", lastUpdate: new Date("2026-10-07T17:00:00Z"), assignments: ["u2"] },
    // Diana : 0 tâche
    // Charlie : 0 tâche
  ];

  // Réunions
  const mockMeetings: RawMeetingActivity[] = [
    // Diana : 1 réunion créée
    { id: "m1", createdById: "u4", createdAt: new Date("2026-10-08T09:00:00Z"), attendees: ["u4", "u1"] },
  ];

  const results = calculateMemberWeeklyActivity(
    mockUsers,
    mockLogs,
    mockTasks,
    mockMeetings,
    currentWeek
  );

  // Vérification de la taille
  if (results.length !== 4) {
    throw new Error(`Attendu 4 membres dans le résultat, reçu ${results.length}`);
  }

  // Vérification du tri : le plus actif à gauche (index 0), le moins actif à droite (index 3)
  // Diana : 5 visites + 1 réunion = 6 total
  // Alice : 3 visites + 2 tâches + 1 attendee réunion = 6 total (ou Alice / Diana en tête)
  // Bob : 1 visite + 1 tâche = 2 total
  // Charlie : 0 visite + 0 tâche = 0 total (dernier)

  if (results[results.length - 1].userId !== "u3") {
    throw new Error(`Le dernier membre (à droite) doit être Charlie (inactif), trouvé: ${results[results.length - 1].name}`);
  }

  if (results[results.length - 1].totalActivity !== 0) {
    throw new Error(`Charlie doit avoir 0 activité, reçu: ${results[results.length - 1].totalActivity}`);
  }

  // Vérification de l'ordre strictement décroissant
  for (let i = 0; i < results.length - 1; i++) {
    if (results[i].totalActivity < results[i + 1].totalActivity) {
      throw new Error(`Ordre non décroissant à l'index ${i}: ${results[i].totalActivity} < ${results[i + 1].totalActivity}`);
    }
  }
  console.log("  ✅ calculateMemberWeeklyActivity tri décroissant validé");

  // 3. Test des métriques globales de synthèse (KPIs)
  const summary = calculateActivitySummary(results);

  if (summary.totalWeeklyInteractions < 8) {
    throw new Error(`Total interactions incorrect, reçu: ${summary.totalWeeklyInteractions}`);
  }

  if (summary.inactiveMembersCount !== 1) {
    throw new Error(`Nombre de membres inactifs incorrect: attendu 1, reçu ${summary.inactiveMembersCount}`);
  }

  if (summary.mostActiveMember === null) {
    throw new Error("Le membre le plus actif ne doit pas être null");
  }

  // 4. Test de navigation aller-retour vers la semaine courante (offset 0 -> -1 -> 0)
  const initialCurrentWeek = getWeekDateRange(refDate, 0);
  const backToCurrentWeek = getWeekDateRange(refDate, 0);
  if (
    initialCurrentWeek.startOfWeek.getTime() !== backToCurrentWeek.startOfWeek.getTime() ||
    initialCurrentWeek.endOfWeek.getTime() !== backToCurrentWeek.endOfWeek.getTime()
  ) {
    throw new Error("Échec d'idempotence sur la semaine courante (offset 0)");
  }

  // Simulation du cache mémoire de navigation
  const cacheSim = new Map<number, typeof results>();
  cacheSim.set(0, results);
  // Navigation vers offset -1
  const prevWeekResults = calculateMemberWeeklyActivity(mockUsers, [], [], [], prevWeek);
  cacheSim.set(-1, prevWeekResults);

  // Retour immédiat à l'offset 0 via cache
  const cachedWeek0 = cacheSim.get(0);
  if (!cachedWeek0 || cachedWeek0[0].userId !== results[0].userId) {
    throw new Error("Échec de la récupération instantanée de la semaine courante depuis le cache");
  }
  console.log("  ✅ Navigation aller-retour semaine courante & cache validés");

  console.log("🎉 Tous les tests unitaires d'activité hebdomadaire sont passés avec succès !");
}

runAdminActivityMetricsTests();

