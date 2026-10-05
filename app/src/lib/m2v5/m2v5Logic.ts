/**
 * Logique métier et fonctions utilitaires pour le tableau de suivi opérationnel M2V5.
 * Conforme aux standards pédagogiques IMT 2026-2027.
 */

export interface TaskItemM2V5 {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  progress?: number | null;
  dueDate?: Date | string | null;
  workload?: string | null;
  deliverables?: string | null;
  validationCriteria?: string | null;
  validator?: string | null;
  delayReason?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string } | null;
  assignments?: { user: { id: string; name: string } }[];
  updatedAt?: Date | string;
}

/**
 * Calcule la synchronisation bidirectionnelle entre l'avancement (%) et le statut.
 */
export function computeSyncStatusAndProgress(
  current: { status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"; progress: number },
  change: { status?: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"; progress?: number }
): { status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"; progress: number } {
  let nextStatus = change.status !== undefined ? change.status : current.status;
  let nextProgress = change.progress !== undefined ? change.progress : current.progress;

  // Si le changement concerne le progrès
  if (change.progress !== undefined) {
    if (nextProgress === 100) {
      nextStatus = "DONE";
    } else if (nextProgress === 0) {
      if (current.status === "DONE") {
        nextStatus = "TODO";
      }
    } else if (nextProgress > 0 && nextProgress < 100) {
      if (current.status === "TODO" || current.status === "DONE") {
        nextStatus = "IN_PROGRESS";
      }
    }
  }

  // Si le changement concerne le statut
  if (change.status !== undefined) {
    if (change.status === "DONE") {
      nextProgress = 100;
    } else if (change.status === "TODO" && current.progress === 100) {
      nextProgress = 0;
    } else if (change.status === "IN_PROGRESS" && current.progress === 0) {
      nextProgress = 25;
    }
  }

  return { status: nextStatus, progress: nextProgress };
}

/**
 * Détermine si une tâche est en retard d'après son échéance et son état d'avancement.
 */
export function isTaskOverdue(task: TaskItemM2V5, referenceDate = new Date()): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const progress = task.progress ?? (task.status === "DONE" ? 100 : 0);

  return due < referenceDate && task.status !== "DONE" && progress < 100;
}

/**
 * Vérifie si l'utilisateur a le droit d'éditer une tâche inline.
 */
export function canUserEditTask(task: TaskItemM2V5, currentUserId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (!currentUserId) return false;
  if (task.createdById === currentUserId) return true;
  if (task.assignments?.some((a) => a.user.id === currentUserId)) return true;
  return false;
}

/**
 * Génère le contenu TSV (Tab-Separated Values) pour copier le tableau directement dans le presse-papier.
 * Idéal pour coller dans Excel, Teams, Word ou un e-mail avec mise en tableau automatique.
 */
export function generateM2V5ClipboardTsv(tasks: TaskItemM2V5[]): string {
  const headers = [
    "Tâche",
    "Pilote",
    "Échéance",
    "Charge",
    "Livrables",
    "Priorité",
    "Qui valide / Comment",
    "% Avancement",
    "Statut",
    "Dernière MAJ",
    "Retard / Cause",
  ];

  const rows = tasks.map((task) => {
    const assignees = task.assignments?.map((a) => a.user.name).join(", ") ||
      (task.createdBy ? `Créé par ${task.createdBy.name}` : "Non assigné");
    const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString("fr-FR") : "";
    const updatedStr = task.updatedAt ? new Date(task.updatedAt).toLocaleDateString("fr-FR") : "";
    const progressVal = task.progress ?? (task.status === "DONE" ? 100 : 0);

    return [
      task.title,
      assignees,
      dueDateStr,
      task.workload || "",
      task.deliverables || "",
      task.priority || "NORMAL",
      task.validationCriteria || task.validator || "",
      `${progressVal}%`,
      task.status,
      updatedStr,
      task.delayReason || "",
    ].join("\t");
  });

  return [headers.join("\t"), ...rows].join("\n");
}
