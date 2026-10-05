import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Détermination des chemins relatifs et absolus
const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "../..");
export const appDir = path.resolve(rootDir, "app");
export const schemaPath = path.resolve(appDir, "prisma/schema.prisma");
export const envPath = path.resolve(appDir, ".env");

// URL de base de l'application Next.js cible
export const baseUrl = process.env.APP_URL || "http://localhost:3000";

// Liste des 6 utilisateurs attendus d'après le cahier des charges et le seed
export const expectedUsers = [
  { email: "etienne.picard@etu.imt-nord-europe.fr", role: "ADMIN", name: "Etienne PICARD" },
  { email: "liam.bean@etu.imt-nord-europe.fr", role: "ADMIN", name: "Liam BEAN" },
  { email: "hugo.rampazzo@etu.imt-nord-europe.fr", role: "MEMBER", name: "Hugo RAMPAZZO" },
  { email: "milane.fargues@etu.imt-nord-europe.fr", role: "MEMBER", name: "Milane FARGUES" },
  { email: "solal.benqadi@etu.imt-nord-europe.fr", role: "MEMBER", name: "Solal BENQADI" },
  { email: "peter.batllo@etu.imt-nord-europe.fr", role: "MEMBER", name: "Peter BATLLO" },
];

// Mots de passe de test autorisés pour le seed
export const testPasswords = ["password123", "password"];

// Liste des 11 jalons officiels IMT attendus
export const expectedMilestones = [
  "TD N°1",
  "Amphi Validation positionnement",
  "TD N°2",
  "Séance Libre N°1",
  "TD N°3",
  "MEETING — Convention & Cahier des charges",
  "Séances Libres N°3 à N°7",
  "AUDIT",
  "Séances Libres N°8 à N°16",
  "Soutenance Vague 1",
  "Soutenance Vague 2 + Trophée",
];

// Liste des tables attendues dans la base de données PostgreSQL
export const expectedTables = [
  "User",
  "Project",
  "Task",
  "TaskAssignment",
  "Meeting",
  "MeetingAttendee",
  "MeetingDecision",
  "GanttMilestone",
  "BudgetEntry",
  "Notification",
  "Event",
];

/**
 * Charge les variables d'environnement depuis le fichier app/.env si présent.
 * @returns {Record<string, string>}
 */
export function loadAppEnv() {
  const envVars = {};
  if (!fs.existsSync(envPath)) return envVars;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      envVars[key] = val;
    }
  }
  return envVars;
}
