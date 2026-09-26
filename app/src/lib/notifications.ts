import prisma from "./prisma";

type NotificationType = 
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "TASK_COMPLETED"
  | "MEETING_SCHEDULED"
  | "MEETING_REMINDER"
  | "MILESTONE_APPROACHING";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  relatedEntityId?: string,
  relatedEntityType?: "Task" | "Meeting" | "GanttMilestone"
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        relatedEntityId,
        relatedEntityType,
      },
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }
}

export async function notifyAllUsers(
  type: NotificationType,
  title: string,
  body: string,
  relatedEntityId?: string,
  relatedEntityType?: "Task" | "Meeting" | "GanttMilestone"
) {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const notifications = users.map(u => ({
      userId: u.id,
      type,
      title,
      body,
      relatedEntityId,
      relatedEntityType,
    }));
    await prisma.notification.createMany({ data: notifications });
  } catch (error) {
    console.error("Failed to create bulk notifications", error);
  }
}
