/**
 * Utilitaires de calcul des indicateurs et métriques pour le tableau de bord (Dashboard).
 * Respecte les standards de nommage TypeScript (variables/fonctions en anglais, commentaires en français).
 */

export interface TaskAssignmentSummary {
  userId: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TaskItem {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  dueDate: Date | null;
  assignments: TaskAssignmentSummary[];
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
}

export interface MilestoneItem {
  id: string;
  name: string;
  status: "UPCOMING" | "IN_PROGRESS" | "ACHIEVED" | "MISSED";
}

export interface BudgetEntryItem {
  id: string;
  amount: number | string;
  status: string;
}

export interface MeetingItem {
  id: string;
  title: string;
  scheduledAt: Date;
}

export interface GlobalDashboardMetrics {
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
  lateTasks: number;
  achievedMilestones: number;
  remainingMilestones: number;
  totalBudget: number;
  usedBudget: number;
  budgetPercentage: number;
  remainingBudget: number;
}

export interface MemberProgressItem {
  name: string;
  done: number;
  total: number;
  completionRate: number;
}

export interface WorkloadItem {
  name: string;
  totalAssigned: number;
  inProgress: number;
  todo: number;
  active: number;
}

export interface PersonalSummary {
  totalAssigned: number;
  inProgress: number;
  done: number;
  late: number;
  completionRate: number;
}

/**
 * Calcule les indicateurs globaux du projet.
 */
export function calculateGlobalMetrics(
  tasks: TaskItem[],
  milestones: MilestoneItem[],
  paidBudgetEntries: BudgetEntryItem[],
  totalBudget: number,
  now: Date = new Date()
): GlobalDashboardMetrics {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const lateTasks = tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now
  ).length;

  const achievedMilestones = milestones.filter((m) => m.status === "ACHIEVED").length;
  const remainingMilestones = milestones.length - achievedMilestones;

  const rawUsed = paidBudgetEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const usedBudget = Math.round(rawUsed * 100) / 100;
  const budgetPercentage = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
  const remainingBudget = Math.round((totalBudget - usedBudget) * 100) / 100;

  return {
    totalTasks,
    doneTasks,
    completionRate,
    lateTasks,
    achievedMilestones,
    remainingMilestones,
    totalBudget,
    usedBudget,
    budgetPercentage,
    remainingBudget,
  };
}

/**
 * Calcule l'avancement individuel de chaque membre pour le graphique en double barre.
 * Prend en compte le statut individuel d'assignation s'il est disponible.
 */
export function calculateMemberProgress(users: UserItem[], tasks: TaskItem[]): MemberProgressItem[] {
  return users.map((user) => {
    const userTasks = tasks.filter((task) =>
      task.assignments.some((a) => a.userId === user.id)
    );
    const done = userTasks.filter((task) => {
      const assignment = task.assignments.find((a) => a.userId === user.id);
      return (assignment?.status || task.status) === "DONE";
    }).length;
    const total = userTasks.length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      name: user.name,
      done,
      total,
      completionRate,
    };
  });
}

/**
 * Calcule la charge de travail actuelle (tâches actives : À FAIRE et EN COURS) pour chaque membre.
 * Prend en compte le statut individuel d'assignation s'il est disponible.
 */
export function calculateWorkload(users: UserItem[], tasks: TaskItem[]): WorkloadItem[] {
  return users.map((user) => {
    const userTasks = tasks.filter((task) =>
      task.assignments.some((a) => a.userId === user.id)
    );
    const totalAssigned = userTasks.length;
    const inProgress = userTasks.filter((task) => {
      const assignment = task.assignments.find((a) => a.userId === user.id);
      return (assignment?.status || task.status) === "IN_PROGRESS";
    }).length;
    const todo = userTasks.filter((task) => {
      const assignment = task.assignments.find((a) => a.userId === user.id);
      return (assignment?.status || task.status) === "TODO";
    }).length;
    const active = inProgress + todo;

    return {
      name: user.name,
      totalAssigned,
      inProgress,
      todo,
      active,
    };
  });
}

/**
 * Calcule le résumé personnalisé pour l'utilisateur actuellement connecté.
 * Utilise en priorité son statut individuel sur les tâches collectives.
 */
export function calculatePersonalSummary(
  userId: string,
  tasks: TaskItem[],
  now: Date = new Date()
): PersonalSummary {
  const myTasks = tasks.filter((task) =>
    task.assignments.some((a) => a.userId === userId)
  );

  const totalAssigned = myTasks.length;
  const inProgress = myTasks.filter((task) => {
    const assignment = task.assignments.find((a) => a.userId === userId);
    return (assignment?.status || task.status) === "IN_PROGRESS";
  }).length;
  const done = myTasks.filter((task) => {
    const assignment = task.assignments.find((a) => a.userId === userId);
    return (assignment?.status || task.status) === "DONE";
  }).length;
  const late = myTasks.filter((task) => {
    const assignment = task.assignments.find((a) => a.userId === userId);
    const effStatus = assignment?.status || task.status;
    return effStatus !== "DONE" && task.dueDate && new Date(task.dueDate) < now;
  }).length;
  const completionRate = totalAssigned > 0 ? Math.round((done / totalAssigned) * 100) : 0;

  return {
    totalAssigned,
    inProgress,
    done,
    late,
    completionRate,
  };
}
