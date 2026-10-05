import { TaskStatus, TaskPriority, MeetingStatus, AttendanceStatus } from "@prisma/client";
import prisma from "../src/lib/prisma";

/**
 * Script de peuplement réaliste pour le projet Voilier MINIMOCA (Octobre 2026).
 * Remplace les tâches de test par des données opérationnelles réparties sur les 6 membres.
 */
async function seedRealisticData() {
  console.log("⛵ Démarrage du seed des données réalistes MINIMOCA...");

  // 1. Récupération du projet et des 6 utilisateurs
  const project = await prisma.project.findFirst();
  if (!project) {
    throw new Error("Projet introuvable en base de données.");
  }

  const users = await prisma.user.findMany();
  if (users.length === 0) {
    throw new Error("Aucun utilisateur trouvé.");
  }

  const userMap = new Map<string, string>();
  for (const u of users) {
    userMap.set(u.name.toLowerCase(), u.id);
  }

  const getUserId = (name: string): string => {
    const id = userMap.get(name.toLowerCase());
    if (!id) throw new Error(`Utilisateur ${name} non trouvé dans la base.`);
    return id;
  };

  const etienneId = getUserId("Etienne");
  const liamId = getUserId("Liam");
  const hugoId = getUserId("Hugo");
  const milaneId = getUserId("Milane");
  const solalId = getUserId("Solal");
  const peterId = getUserId("Peter");

  // 2. Nettoyage des anciennes tâches factices
  console.log("  🧹 Suppression des tâches de test obsolètes...");
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});

  // 3. Définition des tâches réelles MINIMOCA
  const realisticTasks = [
    // Phase 1 : Tâches Terminées (DONE)
    {
      title: "Recherche bibliographique et analyse du rapport MINIMOCA N-1",
      description: "Étude détaillée des retours d'expérience de la promotion précédente (problèmes d'étanchéité et rigidité du mât).",
      status: TaskStatus.DONE,
      priority: TaskPriority.NORMAL,
      workload: "6h",
      deliverables: "Fiche de synthèse des points d'amélioration",
      progress: 100,
      dueDate: new Date("2026-09-24T18:00:00Z"),
      completedAt: new Date("2026-09-23T16:00:00Z"),
      createdById: etienneId,
      assigneeIds: [etienneId, hugoId],
      tags: ["Recherche", "Rapport"],
    },
    {
      title: "Constitution de l'équipe et répartition des responsabilités",
      description: "Définition des rôles clés (structure, électronique, voilure, communication, budget).",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      workload: "2h",
      deliverables: "Organigramme et matrice RACI de l'équipe",
      progress: 100,
      dueDate: new Date("2026-09-18T18:00:00Z"),
      completedAt: new Date("2026-09-18T14:30:00Z"),
      createdById: etienneId,
      assigneeIds: [etienneId, liamId],
      tags: ["Management", "Équipe"],
    },
    {
      title: "Validation du positionnement en Amphi de rentrée",
      description: "Présentation des ambitions du groupe Voilier MINIMOCA et validation par l'équipe pédagogique.",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      workload: "3h",
      deliverables: "Fiche de positionnement validée",
      progress: 100,
      dueDate: new Date("2026-09-29T12:00:00Z"),
      completedAt: new Date("2026-09-29T11:45:00Z"),
      createdById: liamId,
      assigneeIds: [liamId, peterId],
      tags: ["Jalon", "Présentation"],
    },
    {
      title: "Inventaire de l'outillage et des consommables au Fablab",
      description: "Vérification des machines de découpe laser, imprimantes 3D et disponibilité des résines/tissus.",
      status: TaskStatus.DONE,
      priority: TaskPriority.NORMAL,
      workload: "4h",
      deliverables: "Listing du stock Fablab et besoins de réassort",
      progress: 100,
      dueDate: new Date("2026-10-01T18:00:00Z"),
      completedAt: new Date("2026-10-01T17:15:00Z"),
      createdById: etienneId,
      assigneeIds: [solalId, milaneId],
      tags: ["Fablab", "Matériel"],
    },

    // Phase 2 : Tâches En cours (IN_PROGRESS)
    {
      title: "Rédaction du Cahier des charges fonctionnel V2",
      description: "Formalisation des exigences techniques, contraintes de jauge MINIMOCA et critères de navigabilité.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      workload: "12h",
      deliverables: "Document complet du Cahier des charges V2",
      progress: 75,
      dueDate: new Date("2026-10-12T18:00:00Z"),
      createdById: etienneId,
      assigneeIds: [etienneId, liamId],
      tags: ["Cahier des charges", "Documentation"],
    },
    {
      title: "Modélisation 3D de la coque sous SolidWorks",
      description: "Conception paramétrique des formes de coque, couples et emplacement des servos.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      workload: "16h",
      deliverables: "Fichiers CAO .SLDPRT et assemblage général",
      progress: 60,
      dueDate: new Date("2026-10-18T18:00:00Z"),
      createdById: hugoId,
      assigneeIds: [hugoId],
      tags: ["CAO", "Coque"],
    },
    {
      title: "Dimensionnement du système de direction et servomoteur Savöx",
      description: "Calcul du bras de levier, choix du servo de gouvernail et axe de safran.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.NORMAL,
      workload: "8h",
      deliverables: "Note de calcul de couple et schéma d'implantation",
      progress: 50,
      dueDate: new Date("2026-10-15T18:00:00Z"),
      createdById: liamId,
      assigneeIds: [milaneId],
      tags: ["Mécanique", "Électronique"],
    },
    {
      title: "Conception du plan de voilure et gabarit de coupe Icarex",
      description: "Calcul de la surface de grand-voile et foc selon la jauge, préparation des laizes.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      workload: "10h",
      deliverables: "Patrons de découpe 2D et choix des renforts Dacron",
      progress: 40,
      dueDate: new Date("2026-10-16T18:00:00Z"),
      createdById: etienneId,
      assigneeIds: [solalId],
      tags: ["Voilure", "Matelotage"],
    },
    {
      title: "Préparation des diapositives pour la présentation Pecha Kucha",
      description: "Création des 20 diapositives (format 20s par slide) présentant le projet et la démarche d'ingénierie.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      workload: "6h",
      deliverables: "Diaporama finalisé Pecha Kucha",
      progress: 65,
      dueDate: new Date("2026-10-10T18:00:00Z"),
      createdById: peterId,
      assigneeIds: [peterId, etienneId],
      tags: ["Communication", "Soutenance"],
    },

    // Phase 3 : Tâches À faire (TODO)
    {
      title: "Signature de la convention de cadrage par le tuteur enseignant",
      description: "Remise du document de cadrage finalisé pour validation officielle par les enseignants référents.",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      workload: "1h",
      deliverables: "Convention signée et archivée",
      progress: 20,
      dueDate: new Date("2026-10-04T18:00:00Z"), // Échéance hier -> en retard intentionnellement pour refléter l'alerte
      delayReason: "En attente du retour de validation de l'enseignant référent",
      createdById: etienneId,
      assigneeIds: [etienneId],
      tags: ["Administratif", "Convention"],
    },
    {
      title: "Calcul de stabilité hydrostatique et devis de masse du bulbe de quille",
      description: "Évaluation du couple de redressement à la gîte et dosage du plomb de bulbe (objectif 1.8 kg).",
      status: TaskStatus.TODO,
      priority: TaskPriority.NORMAL,
      workload: "8h",
      deliverables: "Courbe de stabilité et moule de coulage du bulbe",
      progress: 0,
      dueDate: new Date("2026-10-24T18:00:00Z"),
      createdById: hugoId,
      assigneeIds: [hugoId, solalId],
      tags: ["Hydrodynamique", "Quille"],
    },
    {
      title: "Commande des fournitures composites (résine époxy, gelcoat, carbone)",
      description: "Passation des commandes auprès des fournisseurs sélectionnés et suivi logistique.",
      status: TaskStatus.TODO,
      priority: TaskPriority.NORMAL,
      workload: "3h",
      deliverables: "Bons de commande validés",
      progress: 0,
      dueDate: new Date("2026-10-14T18:00:00Z"),
      createdById: liamId,
      assigneeIds: [liamId],
      tags: ["Approvisionnement", "Budget"],
    },
    {
      title: "Découpe laser des couples et membrures en bois médium au Fablab",
      description: "Export des fichiers DXF depuis la CAO et réalisation de la découpe laser pour le chantier de coque.",
      status: TaskStatus.TODO,
      priority: TaskPriority.NORMAL,
      workload: "5h",
      deliverables: "Ensemble des membrures usinées",
      progress: 0,
      dueDate: new Date("2026-10-25T18:00:00Z"),
      createdById: peterId,
      assigneeIds: [peterId],
      tags: ["Fabrication", "Fablab"],
    },
    {
      title: "Schéma électrique de la radiocommande Futaba 6K et accumulateur NiMH",
      description: "Raccordement du récepteur 2.4GHz, interrupteur étanche, treuil et servo de barre.",
      status: TaskStatus.TODO,
      priority: TaskPriority.NORMAL,
      workload: "4h",
      deliverables: "Schéma de câblage validé et banc de test miniature",
      progress: 0,
      dueDate: new Date("2026-10-28T18:00:00Z"),
      createdById: milaneId,
      assigneeIds: [milaneId],
      tags: ["Électronique", "Câblage"],
    },
    {
      title: "Essai d'étanchéité et test des servomoteurs en bassin d'essai",
      description: "Mise à l'eau de la coque lestée et vérification des passages d'axes sous pression statique.",
      status: TaskStatus.TODO,
      priority: TaskPriority.NORMAL,
      workload: "6h",
      deliverables: "Compte rendu de navigabilité et relevé d'étanchéité",
      progress: 0,
      dueDate: new Date("2026-11-10T18:00:00Z"),
      createdById: etienneId,
      assigneeIds: [solalId, peterId, hugoId],
      tags: ["Essais", "Bassin"],
    },
  ];

  console.log(`  📝 Création de ${realisticTasks.length} tâches réelles MINIMOCA...`);
  for (let i = 0; i < realisticTasks.length; i++) {
    const taskDef = realisticTasks[i];
    const createdTask = await prisma.task.create({
      data: {
        projectId: project.id,
        createdById: taskDef.createdById,
        title: taskDef.title,
        description: taskDef.description,
        status: taskDef.status,
        priority: taskDef.priority,
        position: i + 1,
        workload: taskDef.workload,
        deliverables: taskDef.deliverables,
        progress: taskDef.progress,
        dueDate: taskDef.dueDate,
        completedAt: taskDef.completedAt,
        delayReason: taskDef.delayReason,
        tags: taskDef.tags,
      },
    });

    for (const userId of taskDef.assigneeIds) {
      await prisma.taskAssignment.create({
        data: {
          taskId: createdTask.id,
          userId,
        },
      });
    }
  }

  // 4. Mise à jour de la prochaine réunion planifiée
  console.log("  📅 Création d'une réunion imminente...");
  await prisma.meetingAttendee.deleteMany({});
  await prisma.meetingDecision.deleteMany({});
  await prisma.meeting.deleteMany({});

  const upcomingMeetingDate = new Date();
  upcomingMeetingDate.setDate(upcomingMeetingDate.getDate() + 3);
  upcomingMeetingDate.setHours(14, 0, 0, 0);

  const newMeeting = await prisma.meeting.create({
    data: {
      projectId: project.id,
      createdById: etienneId,
      title: "Point Hebdo N°1 — Validation Cahier des charges & Revue Fablab",
      objectives: "Revue collective du Cahier des charges V2, point d'étape CAO SolidWorks et calage des commandes.",
      location: "Salle Projet IMT / Fablab",
      status: MeetingStatus.PLANNED,
      scheduledAt: upcomingMeetingDate,
    },
  });

  // Associer les participants
  for (const u of users) {
    await prisma.meetingAttendee.create({
      data: {
        meetingId: newMeeting.id,
        userId: u.id,
        status: AttendanceStatus.PRESENT,
      },
    });
  }

  console.log("✅ Seed des données réalistes MINIMOCA terminé avec succès !");
}

seedRealisticData()
  .catch((e) => {
    console.error("❌ Erreur pendant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
