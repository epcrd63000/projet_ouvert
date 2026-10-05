/**
 * @file agendaService.ts
 * Service métier dédié à la préparation des réunions, la génération d'ordre du jour par IA,
 * le formatage d'annonces d'équipe et la synchronisation avec le tableau Kanban.
 */

import { prisma } from "../prisma";

export interface MeetingContext {
  id: string;
  title: string;
  scheduledAt: string | Date;
  location?: string | null;
  attendees: Array<{ user: { name: string } }>;
}

export const DEFAULT_AGENDA_PROMPT_TEMPLATE = `Tu es le secrétaire technique et assistant d'organisation du projet 'Voilier MINIMOCA' (IMT Nord Europe).
Ton rôle est de structurer un ORDRE DU JOUR et une CONVOCATION de réunion claire, stimulante et orientée action à partir des notes vocales ou réflexions brutes.
L'équipe est composée de 6 élèves-ingénieurs : Étienne (Chef de projet), Liam (Second), Hugo, Milane, Solal, Peter.

Génère un texte clair et bien mis en page en Markdown respectant impérativement ces 3 parties :

### 🎯 Objectifs & Enjeux de la séance
- Objectif principal à atteindre lors de la réunion
- Décisions clés à trancher

### 📋 Ordre du Jour & Sujets Abordés
1. **[Thème 1]** : Détails des points à passer en revue
2. **[Thème 2]** : Points techniques ou financiers

### 🛠️ Préparatifs & Livrables Requis par Membre
(Précise ce que chacun doit apporter ou préparer avant la réunion)
- **Étienne (Chef de projet)** : ...
- **Liam (Second)** : ...
- **Hugo** : ...
- **Milane** : ...
- **Solal** : ...
- **Peter** : ...`;

/**
 * Compile le prompt officiel prêt à être copié dans ChatGPT ou Gemini avec le contexte de la réunion.
 */
export function compileAgendaPrompt(meeting: MeetingContext, rawNotes: string): string {
  const attendeesList = meeting.attendees.map((a) => a.user.name).join(", ") || "Équipe complète";
  const dateStr = new Date(meeting.scheduledAt).toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const header = `[CONTEXTE RÉUNION MINIMOCA]
Titre : ${meeting.title}
Date & Heure : ${dateStr}
Lieu : ${meeting.location || "Salle de projet / FabLab"}
Participants convoqués : ${attendeesList}

[NOTES VOCALES / RÉFLEXIONS BRUTES DU CHEF DE PROJET]
${rawNotes || "(Notes prises à la volée avant la séance)"}
---------------------------------------------------\n\n`;

  return header + DEFAULT_AGENDA_PROMPT_TEMPLATE;
}

/**
 * Formate une annonce d'ordre du jour prête à être collée dans WhatsApp, Discord ou un email.
 */
export function formatDiscordAnnouncement(
  meeting: MeetingContext,
  agendaMarkdown: string
): string {
  const dateFormatted = new Date(meeting.scheduledAt).toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const participants = meeting.attendees.map((a) => a.user.name).join(", ") || "Équipe Voilier MINIMOCA";

  return `📢 **CONVOCATION & ORDRE DU JOUR : ${meeting.title}**

📅 **Date & Heure** : ${dateFormatted}
📍 **Lieu** : ${meeting.location || "Salle de projet / FabLab"}
👥 **Participants convoqués** : ${participants}

---
${agendaMarkdown.trim()}
---
💡 *Pensez à consulter vos tâches et apporter vos livrables. À très vite !*`;
}

/**
 * Construit les métadonnées de liaison pour la tâche Kanban partagée de préparation.
 */
export function buildMeetingTaskMetadata(
  meetingId: string,
  title: string,
  scheduledAt: string | Date
) {
  const refTag = `[MeetingId: ${meetingId}]`;
  return {
    title: `📅 Préparer la réunion : ${title}`,
    description: `Tâche collective de préparation pour la réunion "${title}". Consultez l'ordre du jour sur la fiche réunion. ${refTag}`,
    tags: ["Réunion", "Préparation"],
    dueDate: new Date(scheduledAt),
    meetingRefTag: refTag,
  };
}

/**
 * Extrait un court extrait textuel de l'ordre du jour.
 */
export function extractAgendaSummary(markdown: string): string {
  if (!markdown) return "";
  const cleaned = markdown
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\r?\n+/g, " ")
    .trim();
  return cleaned.length > 200 ? cleaned.slice(0, 197) + "..." : cleaned;
}

/**
 * Crée ou met à jour la tâche Kanban unique partagée pour la préparation d'une réunion.
 */
export async function syncMeetingPreparationTask(params: {
  meetingId: string;
  projectId: string;
  title: string;
  scheduledAt: string | Date;
  attendeeIds: string[];
  createdById?: string | null;
}) {
  const meta = buildMeetingTaskMetadata(params.meetingId, params.title, params.scheduledAt);

  // Recherche d'une tâche existante via la clé de liaison
  const existingTask = await prisma.task.findFirst({
    where: {
      projectId: params.projectId,
      description: { contains: meta.meetingRefTag },
    },
    include: { assignments: true },
  });

  if (existingTask) {
    // Mise à jour de la date d'échéance et du titre
    await prisma.task.update({
      where: { id: existingTask.id },
      data: {
        title: meta.title,
        dueDate: meta.dueDate,
      },
    });

    // Synchronisation des assignations
    const currentAssigneeIds = existingTask.assignments.map((a) => a.userId);
    const toAdd = params.attendeeIds.filter((id) => !currentAssigneeIds.includes(id));
    for (const userId of toAdd) {
      await prisma.taskAssignment.create({
        data: { taskId: existingTask.id, userId },
      });
    }
    return existingTask.id;
  }

  // Création de la nouvelle tâche si non existante
  const taskCount = await prisma.task.count({ where: { projectId: params.projectId } });
  const newTask = await prisma.task.create({
    data: {
      projectId: params.projectId,
      title: meta.title,
      description: meta.description,
      dueDate: meta.dueDate,
      createdById: params.createdById,
      status: "TODO",
      priority: "NORMAL",
      position: taskCount + 1,
      tags: meta.tags,
    },
  });

  for (const userId of Array.from(new Set(params.attendeeIds))) {
    await prisma.taskAssignment.create({
      data: { taskId: newTask.id, userId },
    });
  }

  return newTask.id;
}

/**
 * Supprime la tâche de préparation de réunion dès que celle-ci est terminée ou supprimée.
 */
export async function deleteMeetingPreparationTask(meetingId: string) {
  const meta = buildMeetingTaskMetadata(meetingId, "", new Date());
  const tasks = await prisma.task.findMany({
    where: { description: { contains: meta.meetingRefTag } },
    select: { id: true },
  });

  for (const t of tasks) {
    await prisma.task.delete({ where: { id: t.id } });
  }
}
