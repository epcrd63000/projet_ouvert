export type TaskAssignmentMode = "self" | "others";

type TaskAssignmentResolution =
  | { assigneeIds: string[] }
  | { error: "forbidden" | "missing-assignee" };

export function resolveTaskAssignees(
  role: string,
  actorId: string,
  mode: TaskAssignmentMode,
  requestedAssigneeIds: string[]
): TaskAssignmentResolution {
  if (mode === "self") {
    return { assigneeIds: [actorId] };
  }

  if (role !== "ADMIN") {
    return { error: "forbidden" };
  }

  const assigneeIds = Array.from(new Set(requestedAssigneeIds));
  if (assigneeIds.length === 0) {
    return { error: "missing-assignee" };
  }

  return { assigneeIds };
}

export function getTaskListAssigneeId(
  role: string,
  actorId: string,
  requestedUserId: string | null,
  showAll: boolean
): string | undefined {
  if (role !== "ADMIN") {
    return actorId;
  }

  if (showAll) {
    return undefined;
  }

  return requestedUserId || actorId;
}
