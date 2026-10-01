import { Role, MilestoneStatus } from "@prisma/client";

// Ressources recensées dans le bilan final : APICIL + BDE + consommables FabLab.
export const PROJECT_FUNDING = {
  apicil: 2997,
  bde: 116,
  fablab: 70,
} as const;

/**
 * Projet singleton de référence pour l'année universitaire IMT 2026-2027.
 */
export const SEED_PROJECT = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Projet Ouvert IMT 2026-2027",
  description: "Projet d'ingénierie d'ouverture IMT Nord Europe - Promotion CI1 2026-2027",
  totalBudget: PROJECT_FUNDING.apicil + PROJECT_FUNDING.bde + PROJECT_FUNDING.fablab,
  startDate: new Date("2026-09-14T08:00:00.000Z"),
  endDate: new Date("2027-05-11T18:00:00.000Z"),
};

/**
 * Liste des 6 utilisateurs officiels du projet avec leurs rôles respectifs.
 */
export const SEED_USERS = [
  { name: "Etienne", email: "etienne@imt.fr", role: Role.ADMIN },
  { name: "Liam", email: "liam@imt.fr", role: Role.ADMIN },
  { name: "Hugo", email: "hugo@imt.fr", role: Role.MEMBER },
  { name: "Milane", email: "milane@imt.fr", role: Role.MEMBER },
  { name: "Solal", email: "solal@imt.fr", role: Role.MEMBER },
  { name: "Peter", email: "peter@imt.fr", role: Role.MEMBER },
];

/**
 * Les 11 jalons officiels du planning général IMT Nord Europe CI1 2026-2027.
 */
export const SEED_MILESTONES = [
  {
    name: "TD N°1",
    description: "Présentation Module - Découverte du Projet Ouvert et constitution initiale",
    startDate: new Date("2026-09-14T08:00:00.000Z"),
    endDate: new Date("2026-09-16T12:15:00.000Z"),
    color: "#6366f1",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "Amphi Validation positionnement",
    description: "Validation du positionnement de chaque groupe + Conditions Fablab + Pôle Communication",
    startDate: new Date("2026-09-29T08:00:00.000Z"),
    endDate: new Date("2026-09-29T12:15:00.000Z"),
    color: "#8b5cf6",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "TD N°2",
    description: "Présentation Module suite - Affinage de la méthodologie projet",
    startDate: new Date("2026-10-02T08:00:00.000Z"),
    endDate: new Date("2026-10-07T12:15:00.000Z"),
    color: "#6366f1",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "Séance Libre N°1",
    description: "S1 - Travail en autonomie (Attention vacances scolaires)",
    startDate: new Date("2026-10-20T14:00:00.000Z"),
    endDate: new Date("2026-10-20T18:00:00.000Z"),
    color: "#3b82f6",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "TD N°3",
    description: "Vérification contact client-objectif-besoin de chaque groupe",
    startDate: new Date("2026-11-02T08:00:00.000Z"),
    endDate: new Date("2026-11-04T12:15:00.000Z"),
    color: "#6366f1",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "MEETING — Convention & Cahier des charges",
    description: "Convention signée et complétion du cahier des charges avec les tuteurs",
    startDate: new Date("2026-11-16T08:00:00.000Z"),
    endDate: new Date("2026-11-16T18:00:00.000Z"),
    color: "#ec4899",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "Séances Libres N°3 à N°7",
    description: "Phase de conception et développements préliminaires (Séances S3 à S7)",
    startDate: new Date("2026-11-24T14:00:00.000Z"),
    endDate: new Date("2027-01-05T18:00:00.000Z"),
    color: "#3b82f6",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "AUDIT",
    description: "Vérification du bon déroulement du PO - Oral avec intervenants extérieurs",
    startDate: new Date("2027-01-11T08:00:00.000Z"),
    endDate: new Date("2027-01-11T18:00:00.000Z"),
    color: "#ef4444",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "Séances Libres N°8 à N°16",
    description: "Phase de réalisation intensive, prototypage et tests (Séances S8 à S16)",
    startDate: new Date("2027-01-19T14:00:00.000Z"),
    endDate: new Date("2027-04-06T18:00:00.000Z"),
    color: "#3b82f6",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "Soutenance Vague 1",
    description: "Soutenance vague 1 - Projet reconduit",
    startDate: new Date("2027-05-04T14:00:00.000Z"),
    endDate: new Date("2027-05-04T18:00:00.000Z"),
    color: "#10b981",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
  {
    name: "Soutenance Vague 2 + Trophée",
    description: "Soutenance vague 2 - Projet en création + Trophée Inter Projets (Moment convivial et vidéo)",
    startDate: new Date("2027-05-11T13:30:00.000Z"),
    endDate: new Date("2027-05-11T18:00:00.000Z"),
    color: "#f59e0b",
    status: MilestoneStatus.UPCOMING,
    isPreloaded: true,
  },
];
