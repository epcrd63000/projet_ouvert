import assert from "assert";
import { loadAppEnv } from "../00_common/config.mjs";

const envVars = loadAppEnv();
for (const [key, value] of Object.entries(envVars)) {
  if (!process.env[key]) process.env[key] = value;
}

import {
  compileAgendaPrompt,
  formatDiscordAnnouncement,
  buildMeetingTaskMetadata,
  syncMeetingPreparationTask,
  deleteMeetingPreparationTask,
} from "../../app/src/lib/meetings/agendaService";
import { prisma } from "../../app/src/lib/prisma";

/**
 * Test T1.17 : Validation de l'Ordre du Jour IA, des Annonces Discord et de la Synchronisation Kanban.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.17: Validation de l'Ordre du Jour IA & Cycle de vie de la tâche Kanban...");

  const mockMeeting = {
    id: "test-meet-agenda-999",
    title: "Point Préparatoire Jalon Pecha Kucha",
    scheduledAt: new Date("2026-10-20T10:00:00Z"),
    location: "Salle B204",
    attendees: [
      { user: { name: "Étienne PICARD" } },
      { user: { name: "Liam BEAN" } },
      { user: { name: "Milane FARGUES" } },
    ],
  };

  // 1. Compilation du prompt d'ordre du jour
  const rawNotes = "Étienne présente le pitch 20x20s. Liam amène les diapos de la quille. Milane prépare la démo batterie.";
  const prompt = compileAgendaPrompt(mockMeeting, rawNotes);

  assert.ok(prompt.includes("Point Préparatoire Jalon Pecha Kucha"), "Le titre doit être inclus dans le prompt");
  assert.ok(prompt.includes("Salle B204"), "Le lieu doit être présent dans le prompt");
  assert.ok(prompt.includes(rawNotes), "Les notes vocales brutes doivent être intégrées");
  assert.ok(prompt.includes("Étienne PICARD, Liam BEAN, Milane FARGUES"), "Les participants doivent être listés");

  // 2. Formatage de l'annonce d'équipe (Discord / WhatsApp)
  const sampleAgenda = `### 🎯 Objectifs
- Répéter le timing de 6 min 40 s
- Valider les 20 diapositives

### 🛠️ Préparatifs
- **Milane** : Présenter le banc batterie`;

  const announcement = formatDiscordAnnouncement(mockMeeting, sampleAgenda);
  assert.ok(announcement.includes("📢 **CONVOCATION & ORDRE DU JOUR"), "L'en-tête officiel doit être présent");
  assert.ok(announcement.includes(mockMeeting.title), "Le titre doit figurer dans l'annonce");
  assert.ok(announcement.includes("**Milane** : Présenter le banc batterie"), "Le contenu de l'ordre du jour doit être conservé");

  // 3. Test de synchronisation et de cycle de vie en base (si projet et utilisateurs existent)
  const project = await prisma.project.findFirst();
  const testUser = await prisma.user.findFirst();

  if (project && testUser) {
    const testMeetingId = "tmp-agenda-sync-" + Date.now();
    try {
      // Création de la tâche de préparation
      const taskId = await syncMeetingPreparationTask({
        meetingId: testMeetingId,
        projectId: project.id,
        title: "Test Réunion Synchro",
        scheduledAt: new Date("2026-10-25T14:00:00Z"),
        attendeeIds: [testUser.id],
        createdById: testUser.id,
      });

      assert.ok(taskId, "Une tâche Kanban doit avoir été créée");

      const createdTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignments: true },
      });

      assert.ok(createdTask, "La tâche doit exister en base");
      assert.strictEqual(createdTask.tags.includes("Préparation"), true, "La tâche doit avoir le tag Préparation");
      assert.strictEqual(createdTask.assignments.length, 1, "La tâche doit être assignée au membre");

      // Test de suppression automatique
      await deleteMeetingPreparationTask(testMeetingId);

      const deletedTask = await prisma.task.findUnique({ where: { id: taskId } });
      assert.strictEqual(deletedTask, null, "La tâche de préparation doit avoir été supprimée");
      console.log("     ✓ Cycle de vie de la tâche Kanban (création, assignation, suppression) validé.");
    } finally {
      // Nettoyage de sécurité
      await deleteMeetingPreparationTask(testMeetingId);
    }
  }

  console.log("✅ [Tier 1] Test 1.17: Succès intégral des tests d'Ordre du Jour IA et Kanban !");
}

runTest().catch((err) => {
  console.error("❌ Échec Test 1.17:", err);
  process.exit(1);
});
