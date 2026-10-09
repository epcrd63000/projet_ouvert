/**
 * Tests unitaires TDD pour l'édition et la mise à jour des réunions (Projet Ouvert IMT).
 * Valide :
 * 1. La conversion et le formatage des dates datetime-local (HTML5) <-> ISO 8601.
 * 2. Le calcul du différentiel des participants pour préserver les statuts d'émargement.
 * 3. La synchronisation des événements de calendrier associés (titre, horaires, description).
 * 4. La validation du schéma de modification de réunion.
 */

import {
  formatToDateTimeLocal,
  parseDateTimeLocalToIso,
  computeAttendeeDiff,
  buildCalendarEventSyncData,
  meetingEditSchema,
} from "../lib/meetings/meetingEditService";

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Échec du test : ${message}`);
  }
}

function runMeetingEditLogicTests() {
  console.log("🧪 Lancement des tests unitaires TDD pour l'Édition des Réunions...");

  // 1. Formatage vers datetime-local
  console.log("  1. Test formatToDateTimeLocal...");
  const dateIso = "2026-10-14T14:30:00.000Z";
  const formatted = formatToDateTimeLocal(dateIso);
  assertTrue(formatted.length === 16, "Doit avoir le format YYYY-MM-DDTHH:mm");
  assertTrue(formatted.includes("T"), "Doit inclure le séparateur T");
  assertTrue(!formatted.includes("Z"), "Ne doit pas inclure Z dans un champ datetime-local");
  assertTrue(formatToDateTimeLocal(null) === "", "Doit renvoyer une chaîne vide pour null");
  assertTrue(formatToDateTimeLocal("invalid") === "", "Doit renvoyer une chaîne vide pour une date invalide");
  console.log("     ✓ Formatage datetime-local validé :", formatted);

  // 2. Parsing depuis datetime-local vers ISO
  console.log("  2. Test parseDateTimeLocalToIso...");
  const localVal = "2026-10-14T14:30";
  const isoOutput = parseDateTimeLocalToIso(localVal);
  assertTrue(isoOutput.endsWith("Z") || isoOutput.includes("+"), "Doit renvoyer un format ISO 8601");
  let hasThrown = false;
  try {
    parseDateTimeLocalToIso("");
  } catch {
    hasThrown = true;
  }
  assertTrue(hasThrown, "Doit lever une erreur sur chaîne vide");
  console.log("     ✓ Conversion datetime-local vers ISO 8601 validée :", isoOutput);

  // 3. Calcul du différentiel des participants
  console.log("  3. Test computeAttendeeDiff...");
  const currentAttendees = ["user-1", "user-2", "user-3"];
  const newAttendees = ["user-2", "user-3", "user-4", "user-5"];
  const diff = computeAttendeeDiff(currentAttendees, newAttendees);

  assertTrue(diff.toAdd.length === 2 && diff.toAdd.includes("user-4") && diff.toAdd.includes("user-5"), "Doit ajouter user-4 et user-5");
  assertTrue(diff.toDelete.length === 1 && diff.toDelete.includes("user-1"), "Doit supprimer user-1");
  assertTrue(diff.unchanged.length === 2 && diff.unchanged.includes("user-2") && diff.unchanged.includes("user-3"), "Doit conserver user-2 et user-3");
  console.log("     ✓ Différentiel des participants validé :", diff);

  // 4. Synchronisation des événements calendrier
  console.log("  4. Test buildCalendarEventSyncData...");
  const eventSync = buildCalendarEventSyncData({
    title: "Point Conception Carène Révisé",
    scheduledAt: "2026-10-14T10:00:00.000Z",
    notes: "Notes mises à jour avec le tuteur",
  });

  assertTrue(eventSync.title === "Point Conception Carène Révisé", "Le titre doit être synchronisé");
  assertTrue(eventSync.startAt instanceof Date, "startAt doit être une Date valide");
  assertTrue(eventSync.endAt instanceof Date, "endAt doit être une Date valide");
  const diffMs = (eventSync.endAt?.getTime() || 0) - (eventSync.startAt?.getTime() || 0);
  assertTrue(diffMs === 60 * 60 * 1000, "La durée par défaut doit être de 60 minutes");
  assertTrue(eventSync.description === "Notes mises à jour avec le tuteur", "La description doit être synchronisée");
  console.log("     ✓ Données de synchronisation d'événement calendrier validées.");

  // 5. Validation du schéma Zod pour la modification
  console.log("  5. Test meetingEditSchema...");
  const validData = {
    title: "Revue Voiles & Gréement",
    scheduledAt: "2026-10-15T09:00:00.000Z",
    location: "FabLab Atelier",
    objectives: "Valider les points d'ancrage",
    notes: "Apporter les schémas",
    status: "IN_PROGRESS",
    attendeeIds: ["user-1", "user-2"],
  };
  const parseResult = meetingEditSchema.safeParse(validData);
  assertTrue(parseResult.success, "Le schéma doit valider les données correctes");

  const invalidData = {
    title: "", // Titre vide non permis
    scheduledAt: "2026-10-15T09:00:00.000Z",
    status: "UNKNOWN_STATUS",
  };
  const failResult = meetingEditSchema.safeParse(invalidData);
  assertTrue(!failResult.success, "Le schéma doit rejeter un titre vide ou statut invalide");
  console.log("     ✓ Schéma Zod de modification de réunion validé.");

  console.log("✅ Tous les tests TDD pour l'Édition des Réunions ont réussi avec succès !");
}

runMeetingEditLogicTests();
