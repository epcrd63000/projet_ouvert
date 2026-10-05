/**
 * Tests unitaires des calculs de métriques du tableau de bord (TDD).
 */

import {
  calculateGlobalMetrics,
  calculateMemberProgress,
  calculateWorkload,
  calculatePersonalSummary,
  TaskItem,
  UserItem,
  MilestoneItem,
  BudgetEntryItem,
} from "../lib/dashboard/dashboardMetrics";

function runDashboardMetricsTests() {
  console.log("🧪 Lancement des tests unitaires des métriques du dashboard...");

  const mockUsers: UserItem[] = [
    { id: "u1", name: "Etienne", email: "etienne@imt.fr" },
    { id: "u2", name: "Liam", email: "liam@imt.fr" },
  ];

  const now = new Date("2026-10-05T12:00:00Z");

  const mockTasks: TaskItem[] = [
    {
      id: "t1",
      title: "Tâche 1 Terminée",
      status: "DONE",
      dueDate: new Date("2026-10-01T12:00:00Z"),
      assignments: [{ userId: "u1", user: mockUsers[0] }],
    },
    {
      id: "t2",
      title: "Tâche 2 En cours",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-10-10T12:00:00Z"),
      assignments: [{ userId: "u1", user: mockUsers[0] }],
    },
    {
      id: "t3",
      title: "Tâche 3 En retard",
      status: "TODO",
      dueDate: new Date("2026-10-03T12:00:00Z"), // Antérieur à now
      assignments: [{ userId: "u2", user: mockUsers[1] }],
    },
    {
      id: "t4",
      title: "Tâche 4 Non assignée",
      status: "TODO",
      dueDate: null,
      assignments: [],
    },
  ];

  const mockMilestones: MilestoneItem[] = [
    { id: "m1", name: "Jalon 1", status: "ACHIEVED" },
    { id: "m2", name: "Jalon 2", status: "UPCOMING" },
    { id: "m3", name: "Jalon 3", status: "UPCOMING" },
  ];

  const mockBudget: BudgetEntryItem[] = [
    { id: "b1", amount: 150.5, status: "PAID" },
    { id: "b2", amount: 50.0, status: "PAID" },
  ];

  // 1. Test des métriques globales
  const globalMetrics = calculateGlobalMetrics(mockTasks, mockMilestones, mockBudget, 1000, now);
  console.assert(globalMetrics.totalTasks === 4, "Total des tâches attendu: 4");
  console.assert(globalMetrics.doneTasks === 1, "Tâches terminées attendues: 1");
  console.assert(globalMetrics.completionRate === 25, "Taux d'achèvement attendu: 25%");
  console.assert(globalMetrics.lateTasks === 1, "Tâches en retard attendues: 1");
  console.assert(globalMetrics.achievedMilestones === 1, "Jalons atteints attendus: 1");
  console.assert(globalMetrics.remainingMilestones === 2, "Jalons restants attendus: 2");
  console.assert(globalMetrics.usedBudget === 200.5, "Budget utilisé attendu: 200.5");
  console.assert(globalMetrics.budgetPercentage === 20, "Budget % attendu: 20%");
  console.log("  ✅ calculateGlobalMetrics validé");

  // 2. Test de l'avancement par membre
  const memberProgress = calculateMemberProgress(mockUsers, mockTasks);
  const etienneProgress = memberProgress.find((m) => m.name === "Etienne");
  console.assert(etienneProgress?.total === 2, "Etienne total attendu: 2");
  console.assert(etienneProgress?.done === 1, "Etienne terminées attendu: 1");
  console.assert(etienneProgress?.completionRate === 50, "Etienne taux attendu: 50%");
  console.log("  ✅ calculateMemberProgress validé");

  // 3. Test de la charge de travail (workload)
  const workload = calculateWorkload(mockUsers, mockTasks);
  const etienneWorkload = workload.find((w) => w.name === "Etienne");
  const liamWorkload = workload.find((w) => w.name === "Liam");
  console.assert(etienneWorkload?.totalAssigned === 2, "Etienne totalAssigned attendu: 2");
  console.assert(liamWorkload?.totalAssigned === 1, "Liam totalAssigned attendu: 1");
  console.assert(etienneWorkload?.inProgress === 1, "Etienne inProgress attendu: 1");
  console.assert(liamWorkload?.inProgress === 0, "Liam inProgress attendu: 0");
  console.assert(etienneWorkload?.active === 1, "Etienne active attendu: 1");
  console.assert(liamWorkload?.active === 1, "Liam active attendu: 1");
  console.assert(liamWorkload?.todo === 1, "Liam todo attendu: 1");
  console.log("  ✅ calculateWorkload validé");

  // 4. Test du résumé personnel
  const personalEtienne = calculatePersonalSummary("u1", mockTasks, now);
  console.assert(personalEtienne.totalAssigned === 2, "Etienne personnel total: 2");
  console.assert(personalEtienne.inProgress === 1, "Etienne personnel inProgress: 1");
  console.assert(personalEtienne.done === 1, "Etienne personnel done: 1");
  console.assert(personalEtienne.late === 0, "Etienne personnel late: 0");
  console.assert(personalEtienne.completionRate === 50, "Etienne personnel completionRate: 50%");

  const personalLiam = calculatePersonalSummary("u2", mockTasks, now);
  console.assert(personalLiam.totalAssigned === 1, "Liam personnel total: 1");
  console.assert(personalLiam.late === 1, "Liam personnel late: 1");
  console.assert(personalLiam.completionRate === 0, "Liam personnel completionRate: 0%");
  console.log("  ✅ calculatePersonalSummary validé");

  console.log("🎉 Tous les tests unitaires des métriques sont passés avec succès !\n");
}

runDashboardMetricsTests();
