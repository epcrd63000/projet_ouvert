/**
 * @file decisionService.ts
 * Service métier gérant le cycle de vie des décisions de réunion et leur conversion en tâches projet.
 */

import { prisma } from "../prisma";
import { AttendanceStatus } from "@prisma/client";

export interface DecisionToTaskResult {
  success: boolean;
  taskId: string;
  alreadyExisted?: boolean;
}

/**
 * Convertit une décision de réunion en une tâche du projet (Kanban / Tableau M2V5).
 * Établit une liaison bidirectionnelle entre la décision et la tâche créée.
 */
export async function convertDecisionToTask(
  decisionId: string,
  currentUserId: string
): Promise<DecisionToTaskResult> {
  // 1. Récupération de la décision et de sa réunion associée
  const decision = await prisma.meetingDecision.findUnique({
    where: { id: decisionId },
    include: {
      meeting: { select: { projectId: true, title: true } },
    },
  });

  if (!decision) {
    throw new Error(`Décision introuvable pour l'identifiant : ${decisionId}`);
  }

  // 2. Si la tâche existe déjà, retourner la référence existante
  if (decision.taskId) {
    return {
      success: true,
      taskId: decision.taskId,
      alreadyExisted: true,
    };
  }

  // 3. Calcul de la position suivante dans le projet
  const taskCount = await prisma.task.count({
    where: { projectId: decision.meeting.projectId },
  });

  // 4. Création de la tâche principale (sans transaction imbriquée pour le mode Neon HTTP)
  const task = await prisma.task.create({
    data: {
      projectId: decision.meeting.projectId,
      title: decision.content,
      description: `Issue de la décision prise lors de la réunion : ${decision.meeting.title}`,
      createdById: currentUserId,
      status: "TODO",
      priority: "NORMAL",
      position: taskCount + 1,
      dueDate: decision.dueDate,
      tags: ["Réunion"],
    },
  });

  // 5. Création des assignations pour l'ensemble des membres sélectionnés
  const targetUserIds: string[] = [];
  if (decision.assigneeIds && decision.assigneeIds.length > 0) {
    targetUserIds.push(...decision.assigneeIds);
  } else if (decision.assigneeId) {
    targetUserIds.push(decision.assigneeId);
  }

  // Évite les doublons et crée les assignations de manière séquentielle
  for (const userId of Array.from(new Set(targetUserIds))) {
    await prisma.taskAssignment.create({
      data: {
        taskId: task.id,
        userId,
      },
    });
  }

  // 6. Association bidirectionnelle avec la décision
  await prisma.meetingDecision.update({
    where: { id: decisionId },
    data: { taskId: task.id },
  });

  return {
    success: true,
    taskId: task.id,
  };
}

/**
 * Met à jour le statut d'émargement d'un participant à une réunion.
 */
export async function updateAttendeeStatus(
  attendeeId: string,
  status: AttendanceStatus
) {
  return prisma.meetingAttendee.update({
    where: { id: attendeeId },
    data: { status },
  });
}
