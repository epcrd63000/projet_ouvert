/**
 * Tests unitaires TDD pour la préparation des réunions et la synchronisation de l'ordre du jour (Projet Ouvert IMT).
 * Valide :
 * 1. La compilation du prompt officiel d'ordre du jour à partir de notes vocales brutes.
 * 2. Le formatage de l'annonce d'équipe prête pour Discord / WhatsApp / Webmail.
 * 3. La génération des métadonnées de liaison pour la tâche Kanban partagée.
 * 4. L'extraction et le nettoyage des rubriques de l'ordre du jour.
 */

import {
  DEFAULT_AGENDA_PROMPT_TEMPLATE,
  compileAgendaPrompt,
  formatDiscordAnnouncement,
  buildMeetingTaskMetadata,
  extractAgendaSummary,
} from "../lib/meetings/agendaService";

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Échec du test : ${message}`);
  }
}

function runAgendaLogicTests() {
  console.log("🧪 Lancement des tests unitaires TDD pour l'Ordre du Jour et les Tâches de Réunion...");

  // 1. Test du modèle de prompt et de la compilation du contexte
  console.log("  1. Test compileAgendaPrompt...");
  const mockMeeting = {
    id: "meet-123",
    title: "Revue de Conception Coque & Gréement",
    scheduledAt: "2026-10-14T14:00:00.000Z",
    location: "Salle 301 - FabLab",
    attendees: [
      { user: { name: "Étienne PICARD" } },
      { user: { name: "Hugo RAMPAZZO" } },
      { user: { name: "Solal BENQADI" } },
    ],
  };

  const rawVoiceNotes = "Hugo doit ramener les fichiers CAO de la carène. Solal prépare le plan de voilure. Moi je fais le point sur le jalon S2.";
  const compiledPrompt = compileAgendaPrompt(mockMeeting, rawVoiceNotes);

  assertTrue(compiledPrompt.includes("Revue de Conception Coque & Gréement"), "Doit inclure le titre de la réunion");
  assertTrue(compiledPrompt.includes("Salle 301 - FabLab"), "Doit inclure le lieu");
  assertTrue(compiledPrompt.includes("Étienne PICARD, Hugo RAMPAZZO, Solal BENQADI"), "Doit inclure les participants");
  assertTrue(compiledPrompt.includes(rawVoiceNotes), "Doit inclure les notes vocales brutes");
  assertTrue(compiledPrompt.includes("MINIMOCA"), "Doit faire référence au projet MINIMOCA");
  console.log("     ✓ Prompt officiel compilé avec succès avec le contexte complet.");

  // 2. Test du formatage de l'annonce Discord / WhatsApp
  console.log("  2. Test formatDiscordAnnouncement...");
  const sampleAgendaMarkdown = `### 🎯 Objectifs
- Valider la forme de coque
- Définir le planning des tests en bassin

### 📋 Sujets abordés
1. Analyse CFD du bulbe
2. Découpe des membrures

### 🛠️ Préparatifs par membre
- **Hugo** : Exporter les fichiers STEP
- **Solal** : Venir avec les échantillons de toile`;

  const announcement = formatDiscordAnnouncement(mockMeeting, sampleAgendaMarkdown);

  assertTrue(announcement.includes("📢 **CONVOCATION & ORDRE DU JOUR"), "Doit comporter l'en-tête officiel de convocation");
  assertTrue(announcement.includes(mockMeeting.title), "Doit contenir le titre de la réunion");
  assertTrue(announcement.includes("Salle 301 - FabLab"), "Doit préciser le lieu");
  assertTrue(announcement.includes("**Hugo** : Exporter les fichiers STEP"), "Doit conserver le contenu de l'ordre du jour");
  assertTrue(announcement.includes("Étienne PICARD, Hugo RAMPAZZO, Solal BENQADI"), "Doit lister les participants");
  console.log("     ✓ Annonce d'équipe Discord / WhatsApp formatée avec succès.");

  // 3. Test des métadonnées de la tâche Kanban liée
  console.log("  3. Test buildMeetingTaskMetadata...");
  const taskMeta = buildMeetingTaskMetadata(mockMeeting.id, mockMeeting.title, mockMeeting.scheduledAt);

  assertTrue(taskMeta.title === "📅 Préparer la réunion : Revue de Conception Coque & Gréement", "Le titre de la tâche doit être explicite");
  assertTrue(taskMeta.tags.includes("Réunion"), "Doit avoir le tag Réunion");
  assertTrue(taskMeta.tags.includes("Préparation"), "Doit avoir le tag Préparation");
  assertTrue(taskMeta.meetingRefTag === `[MeetingId: ${mockMeeting.id}]`, "La référence doit être unique pour synchro");
  assertTrue(taskMeta.description.includes(taskMeta.meetingRefTag), "La description doit contenir la clé de liaison");
  console.log("     ✓ Métadonnées de synchronisation Kanban validées.");

  // 4. Test d'extraction de résumé
  console.log("  4. Test extractAgendaSummary...");
  const summary = extractAgendaSummary(sampleAgendaMarkdown);
  assertTrue(summary.length > 10 && summary.length <= 250, "Le résumé doit être concis");
  console.log("     ✓ Résumé extrait :", summary);

  console.log("✅ Tous les tests TDD pour l'Ordre du Jour ont réussi !");
}

runAgendaLogicTests();
