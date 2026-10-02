import prisma from "./prisma";

import { NotificationType } from "@prisma/client";

/**
 * Crée une notification pour un utilisateur donné.
 */
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
    console.error("Échec de création de la notification", error);
  }
}

/**
 * Notifie un ensemble spécifique d'utilisateurs (par leurs IDs).
 * Exclut optionnellement un utilisateur (ex: l'auteur de l'action).
 */
export async function notifyUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  relatedEntityId?: string,
  relatedEntityType?: "Task" | "Meeting" | "GanttMilestone",
  excludeUserId?: string
) {
  try {
    const filteredIds = excludeUserId
      ? userIds.filter((id) => id !== excludeUserId)
      : userIds;

    if (filteredIds.length === 0) return;

    const notifications = filteredIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      relatedEntityId,
      relatedEntityType,
    }));
    await prisma.notification.createMany({ data: notifications });
  } catch (error) {
    console.error("Échec de création des notifications en masse", error);
  }
}

/**
 * Notifie tous les utilisateurs du projet.
 */
export async function notifyAllUsers(
  type: NotificationType,
  title: string,
  body: string,
  relatedEntityId?: string,
  relatedEntityType?: "Task" | "Meeting" | "GanttMilestone"
) {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const notifications = users.map((u) => ({
      userId: u.id,
      type,
      title,
      body,
      relatedEntityId,
      relatedEntityType,
    }));
    await prisma.notification.createMany({ data: notifications });
  } catch (error) {
    console.error("Échec de création des notifications en masse", error);
  }
}
