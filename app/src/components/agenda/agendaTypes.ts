/**
 * Types TypeScript dédiés au module Agenda et à son volet latéral de tâches.
 */

export type TaskStatusType = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
export type TaskPriorityType = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface AgendaUserSummary {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface AgendaTaskAssignment {
  user: AgendaUserSummary;
}

export interface AgendaTask {
  id: string;
  originalId: string;
  title: string;
  description?: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  progress: number;
  dueDate?: string | Date | null;
  start: Date;
  end: Date;
  isMine: boolean;
  isOverdue: boolean;
  workload?: string | null;
  deliverables?: string | null;
  validationCriteria?: string | null;
  validator?: string | null;
  delayReason?: string | null;
  assignments?: AgendaTaskAssignment[];
  createdBy?: AgendaUserSummary | null;
}

export interface AppCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "meeting" | "task" | "manual" | "milestone";
  status: string;
  originalId: string;
  allDay?: boolean;
  isMine?: boolean;
  isOverdue?: boolean;
  color?: string;
  priority?: TaskPriorityType;
  taskData?: AgendaTask;
}
