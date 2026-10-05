import { Role, MilestoneStatus } from "@prisma/client";

/**
 * Projet singleton de référence pour l'année universitaire IMT 2026-2027.
 */
export const SEED_PROJECT = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Projet Ouvert IMT 2026-2027",
  description: "Projet d'ingénierie d'ouverture IMT Nord Europe - Promotion CI1 2026-2027",
  totalBudget: 3183.0, // Cumul initial des enveloppes (APICIL 2997€ + BDE 116€ + Fablab 70€)
  startDate: new Date("2026-09-14T08:00:00.000Z"),
  endDate: new Date("2027-05-11T18:00:00.000Z"),
};

/**
 * Liste des 6 utilisateurs officiels du projet avec leurs rôles respectifs.
 */
export const SEED_USERS = [
  { name: "Etienne PICARD", email: "etienne.picard@etu.imt-nord-europe.fr", role: Role.ADMIN },
  { name: "Liam BEAN", email: "liam.bean@etu.imt-nord-europe.fr", role: Role.ADMIN },
  { name: "Hugo RAMPAZZO", email: "hugo.rampazzo@etu.imt-nord-europe.fr", role: Role.MEMBER },
  { name: "Milane FARGUES", email: "milane.fargues@etu.imt-nord-europe.fr", role: Role.MEMBER },
  { name: "Solal BENQADI", email: "solal.benqadi@etu.imt-nord-europe.fr", role: Role.MEMBER },
  { name: "Peter BATLLO", email: "peter.batllo@etu.imt-nord-europe.fr", role: Role.MEMBER },
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

/**
 * 3 AI Prompts par défaut pour le projet du Voilier MINIMOCA.
 */
export const SEED_AI_PROMPTS = [
  {
    title: "Générateur de Compte Rendu de Réunion (Modèle Officiel)",
    content: `Tu es le secrétaire technique et assistant IA de l'équipe travaillant sur le projet 'Voilier MINIMOCA' (IMT Nord Europe).
Ton rôle est de générer un compte rendu professionnel, précis, concis et orienté actions à partir des notes brutes ou de la transcription de notre réunion.
L'équipe est composée de 6 membres : Etienne (Chef de projet), Liam (Second), Hugo, Milane, Solal, Peter (Membres).

Réponds IMPÉRATIVEMENT en respectant scrupuleusement la structure suivante délimitée par ces 3 balises exactes :

[OBJECTIFS]
- Objectif 1 abordé
- Objectif 2 abordé
[/OBJECTIFS]

[SYNTHESE]
Rédige ici en Markdown le compte rendu complet et structuré des échanges :
### Points abordés
- Point 1
- Point 2
### Déroulé
Résumé des discussions et arguments échangés.
### Résumé technique
Détails sur l'ingénierie navale, les composants, etc.
[/SYNTHESE]

[DECISIONS]
Pour chaque action validée, ajoute une ligne STRICTEMENT selon le format suivant (très important pour le parsing) :
- [PrénomResponsable] [DateLimite AAAA-MM-JJ ou JJ/MM/AAAA] Intitulé clair de l'action à mener
(Exemple : - [Etienne] [2026-10-25] Valider le design de la coque)
(Exemple : - [Liam] [31/10/2026] Commander les servos de barre)
[/DECISIONS]`,
  },
  {
    title: "Générateur de Tâches à partir de notes",
    content: "En tant qu'assistant de gestion de projet pour le 'Voilier MINIMOCA', analyse le texte suivant et extrais-en une liste de tâches exploitables. Pour chaque tâche, précise un titre court, une description, et si possible la priorité ou la personne assignée si mentionnée.",
  },
  {
    title: "Analyse des Risques Techniques",
    content: "Nous concevons des composants pour le 'Voilier MINIMOCA'. Analyse la proposition technique suivante et liste les risques potentiels (mécaniques, électroniques, environnementaux, ou de coûts). Propose des stratégies d'atténuation pour chaque risque identifié.",
  }
];
