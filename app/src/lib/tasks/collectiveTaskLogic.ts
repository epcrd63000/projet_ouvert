/**
 * Logique métier pour la gestion des statuts collectifs et de la suppression / désassignation des tâches.
 * Respecte les standards de nommage TypeScript (anglais pour le code, français pour les commentaires).
 */

export type TaskStatusType = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

export interface AssignmentWithStatus {
  userId: string;
  status?: TaskStatusType;
}

export interface TaskCollectiveEntity {
  id: string;
  status: TaskStatusType;
  createdById?: string | null;
  assignments: AssignmentWithStatus[];
}

/**
 * Calcule le statut global consolidé d'une tâche collective à partir des statuts de ses assignés.
 * Règle collective stricte :
 * - Si 0 assigné : conserve le statut actuel ou TODO.
 * - Si 100% des assignés sont DONE : le statut global est DONE.
 * - Si au moins un assigné est BLOCKED : le statut global est BLOCKED.
 * - Si au moins un assigné est IN_PROGRESS (ou mix de DONE et TODO) : le statut global est IN_PROGRESS.
 * - Si 100% des assignés sont TODO : le statut global est TODO.
 */
export function computeCollectiveTaskStatus(
  assignments: AssignmentWithStatus[],
  fallbackStatus: TaskStatusType = "TODO"
): TaskStatusType {
  if (!assignments || assignments.length === 0) {
    return fallbackStatus;
  }

  const statuses = assignments.map((a) => a.status || "TODO");

  // Règle 1 : Tous terminés -> DONE
  const allDone = statuses.every((s) => s === "DONE");
  if (allDone) {
    return "DONE";
  }

  // Règle 2 : Au moins un bloqué -> BLOCKED
  const hasBlocked = statuses.some((s) => s === "BLOCKED");
  if (hasBlocked) {
    return "BLOCKED";
  }

  // Règle 3 : Au moins un en cours ou mix de terminé / à faire -> IN_PROGRESS
  const hasInProgress = statuses.some((s) => s === "IN_PROGRESS");
  const hasDone = statuses.some((s) => s === "DONE");
  const hasTodo = statuses.some((s) => s === "TODO");

  if (hasInProgress || (hasDone && hasTodo)) {
    return "IN_PROGRESS";
  }

  // Règle 4 : Tous à faire -> TODO
  return "TODO";
}

/**
 * Renvoie le statut effectif d'une tâche pour un utilisateur donné :
 * - Dans "Mes tâches", c'est son statut individuel d'assignation.
 * - Si l'utilisateur n'est pas assigné ou n'a pas de statut individuel, renvoie le statut global de la tâche.
 */
export function getEffectiveUserTaskStatus(
  task: TaskCollectiveEntity,
  userId: string
): TaskStatusType {
  if (!userId) return task.status;
  const assignment = task.assignments?.find((a) => a.userId === userId);
  return assignment?.status || task.status;
}

export type DeletionAction = "UNASSIGN" | "DELETE";

export interface DeletionDecision {
  action: DeletionAction;
  targetUserId?: string;
  reason: string;
}

/**
 * Détermine l'action à exécuter lors d'une demande de suppression :
 * - Si un membre standard clique sur supprimer :
 *   - Si la tâche comporte > 1 assigné : désassigne uniquement ce membre (UNASSIGN).
 *   - Si la tâche ne comporte qu'un seul assigné ou 0 : supprime complètement la tâche (DELETE).
 * - Si un admin demande explicitement "unassign" : désassigne l'utilisateur ciblé (UNASSIGN).
 * - Si un admin demande explicitement "delete" (ou par défaut sur solo) : supprime la tâche (DELETE).
 */
export function determineTaskDeletionAction(
  task: TaskCollectiveEntity,
  currentUserId: string,
  isAdmin: boolean,
  requestedAction?: "unassign" | "delete"
): DeletionDecision {
  const isMultiAssigned = (task.assignments?.length || 0) > 1;

  // Si une action explicite est demandée par un admin ou membre autorisé
  if (requestedAction === "unassign") {
    return {
      action: "UNASSIGN",
      targetUserId: currentUserId,
      reason: "Désassignation volontaire demandée",
    };
  }

  if (requestedAction === "delete") {
    return {
      action: "DELETE",
      reason: "Suppression définitive demandée",
    };
  }

  // Comportement automatique pour les membres standards
  if (!isAdmin) {
    if (isMultiAssigned) {
      return {
        action: "UNASSIGN",
        targetUserId: currentUserId,
        reason: "Tâche partagée à plusieurs membres : retrait du membre uniquement",
      };
    }
    return {
      action: "DELETE",
      reason: "Tâche individuelle : suppression définitive de la tâche",
    };
  }

  // Comportement par défaut pour les administrateurs sans choix explicite
  if (isMultiAssigned) {
    return {
      action: "UNASSIGN",
      targetUserId: currentUserId,
      reason: "Tâche collective : retrait par défaut de l'administrateur",
    };
  }

  return {
    action: "DELETE",
    reason: "Tâche individuelle : suppression définitive",
  };
}
