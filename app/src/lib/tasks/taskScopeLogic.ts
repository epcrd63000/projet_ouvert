/**
 * Logique métier et fonctions utilitaires pour la portée et les permissions des tâches.
 * Gère le filtrage 'Mes tâches' vs 'Vue globale' et le contrôle d'accès d'édition.
 */

export interface TaskAssignmentUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface TaskAssignmentItem {
  user: TaskAssignmentUser;
}

export interface TaskPermissionItem {
  id: string;
  createdById?: string | null;
  assignments?: TaskAssignmentItem[];
}

/**
 * Détermine si un utilisateur a le droit de modifier une tâche.
 * Un utilisateur peut modifier une tâche s'il est ADMIN, créateur,
 * ou s'il fait partie des assignés (tâche personnelle ou tâche partagée en binôme/équipe).
 */
export function canUserEditTask(
  task: TaskPermissionItem | null | undefined,
  currentUserId: string | null | undefined,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  if (!task || !currentUserId || currentUserId.trim() === "") return false;

  // Créateur de la tâche
  if (task.createdById === currentUserId) return true;

  // Membre assigné (seul ou avec d'autres en tâche partagée)
  if (task.assignments && task.assignments.length > 0) {
    return task.assignments.some((assignment) => assignment.user.id === currentUserId);
  }

  return false;
}

/**
 * Filtre une liste de tâches selon le périmètre d'affichage :
 * - Si showAll est true : retourne toutes les tâches de l'équipe.
 * - Si showAll est false : retourne uniquement les tâches assignées à l'utilisateur
 *   (incluant les tâches partagées en binôme/équipe).
 */
export function filterTasksByScope<T extends TaskPermissionItem>(
  tasks: T[],
  currentUserId: string | null | undefined,
  showAll: boolean
): T[] {
  if (showAll) {
    return tasks;
  }

  if (!currentUserId || currentUserId.trim() === "") {
    return [];
  }

  return tasks.filter((task) =>
    task.assignments?.some((assignment) => assignment.user.id === currentUserId)
  );
}
