import assert from "node:assert/strict";
import {
  getTaskListAssigneeId,
  resolveTaskAssignees,
} from "@/lib/task-assignment";
import { getUpcomingMeetings } from "@/lib/meeting-options";
import { createTaskSchema } from "@/lib/validations/task";

assert.equal(createTaskSchema.parse({ title: "Tâche personnelle" }).assignmentMode, "self");

const memberSelfAssignment = resolveTaskAssignees(
  "MEMBER",
  "member-id",
  "self",
  ["another-user-id"]
);
assert.deepEqual(memberSelfAssignment, { assigneeIds: ["member-id"] });

const adminSelfAssignment = resolveTaskAssignees(
  "ADMIN",
  "admin-id",
  "self",
  ["another-user-id"]
);
assert.deepEqual(adminSelfAssignment, { assigneeIds: ["admin-id"] });

assert.deepEqual(
  resolveTaskAssignees("MEMBER", "member-id", "others", ["another-user-id"]),
  { error: "forbidden" }
);
assert.deepEqual(
  resolveTaskAssignees("ADMIN", "admin-id", "others", []),
  { error: "missing-assignee" }
);
assert.deepEqual(
  resolveTaskAssignees("ADMIN", "admin-id", "others", ["member-id", "member-id"]),
  { assigneeIds: ["member-id"] }
);

assert.equal(getTaskListAssigneeId("MEMBER", "member-id", "other-id", true), "member-id");
assert.equal(getTaskListAssigneeId("ADMIN", "admin-id", null, false), "admin-id");
assert.equal(getTaskListAssigneeId("ADMIN", "admin-id", "member-id", false), "member-id");
assert.equal(getTaskListAssigneeId("ADMIN", "admin-id", null, true), undefined);

const upcomingMeetings = getUpcomingMeetings(
  [
    { id: "later", title: "Plus tard", scheduledAt: "2026-10-30T12:00:00.000Z", status: "PLANNED" },
    { id: "next", title: "Prochaine", scheduledAt: "2026-10-10T12:00:00.000Z", status: "PLANNED" },
    { id: "done", title: "Terminée", scheduledAt: "2026-10-05T12:00:00.000Z", status: "DONE" },
    { id: "past", title: "Passée", scheduledAt: "2026-10-01T12:00:00.000Z", status: "PLANNED" },
    { id: "second", title: "Suivante", scheduledAt: "2026-10-20T12:00:00.000Z", status: "IN_PROGRESS" },
  ],
  Date.parse("2026-10-06T00:00:00.000Z")
);
assert.deepEqual(upcomingMeetings.map((meeting) => meeting.id), ["next", "second"]);

console.log("Task behavior tests passed.");
