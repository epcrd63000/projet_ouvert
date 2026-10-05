import { prisma } from "../src/lib/prisma";
import { TaskPriority, TaskStatus } from "@prisma/client";

/**
 * Script de réinitialisation des tâches pour la mise en production réelle :
 * 1. Suppression de toutes les anciennes tâches de simulation
 * 2. Création d'une tâche de démarrage réaliste et complète pour chaque membre pour la semaine prochaine
 * 3. Préservation totale des jalons Gantt officiels et des réunions d'équipe existantes
 */
async function resetTasksForDeployment() {
  console.log("🧹 Démarrage du nettoyage des tâches de simulation...");

  const project = await prisma.project.findFirst();
  if (!project) {
    throw new Error("Projet principal introuvable !");
  }

  // Récupération de tous les utilisateurs officiels
  const users = await prisma.user.findMany();
  const userMap = new Map(users.map((u) => [u.name.split(" ")[0].toLowerCase(), u]));

  const etienne = userMap.get("etienne");
  const liam = userMap.get("liam");
  const hugo = userMap.get("hugo");
  const milane = userMap.get("milane");
  const solal = userMap.get("solal");
  const peter = userMap.get("peter");

  if (!etienne || !liam || !hugo || !milane || !solal || !peter) {
    throw new Error("Un des utilisateurs officiels est manquant en base !");
  }

  // 1. Suppression propre des anciennes tâches (les TaskAssignment seront supprimées par cascade)
  const deletedAssignments = await prisma.taskAssignment.deleteMany();
  console.log(`  🗑️ ${deletedAssignments.count} assignations de tâches supprimées.`);

  const deletedTasks = await prisma.task.deleteMany();
  console.log(`  🗑️ ${deletedTasks.count} anciennes tâches de simulation supprimées.`);

  // 2. Définition des 6 tâches de démarrage officielles pour la semaine prochaine (12 au 18 octobre 2026)
  const deploymentTasks = [
    {
      title: "Revue du cahier des charges et préparation du jalon S2",
      description:
        "Consolider les retours de la séance de validation de positionnement, vérifier la conformité avec les attentes du tuteur pédagogique et finaliser la structure WBS du projet.",
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      workload: "3h",
      deliverables: "Cahier des charges consolidé & structure WBS validée",
      tags: ["Méthodologie", "Gestion de projet"],
      dueDate: new Date("2026-10-14T17:00:00.000Z"),
      assignedUser: etienne,
      createdByUser: etienne,
      position: 0,
    },
    {
      title: "Engagement des bons de commande pour les fournitures composites",
      description:
        "Transmettre les devis validés (résine époxy, tissus de verre et carbone) au pôle achats, vérifier la conformité des montants avec l'enveloppe APICIL et suivre les délais de livraison.",
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      workload: "2h30",
      deliverables: "Bons de commande signés & accusés de réception fournisseurs",
      tags: ["Budget", "Achats"],
      dueDate: new Date("2026-10-13T17:00:00.000Z"),
      assignedUser: liam,
      createdByUser: etienne,
      position: 1,
    },
    {
      title: "Finalisation de la modélisation 3D de la coque sur SolidWorks",
      description:
        "Ajuster les couples de coque selon le plan de forme hydrodynamique, vérifier le dégagement pour le bulbe de quille et exporter les fichiers STEP pour les simulations d'écoulement.",
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.TODO,
      workload: "5h",
      deliverables: "Assemblage SolidWorks (.SLDASM) & export .STEP de la coque",
      tags: ["Conception", "CAO", "Mécanique"],
      dueDate: new Date("2026-10-15T18:00:00.000Z"),
      assignedUser: hugo,
      createdByUser: etienne,
      position: 2,
    },
    {
      title: "Dimensionnement de l'architecture d'alimentation et banc d'essai batterie",
      description:
        "Calculer le bilan de consommation électrique (servomoteurs de gouvernail et d'écoute, récepteur radio), tester la régulation de tension 5V/6V et documenter les courbes de décharge.",
      priority: TaskPriority.NORMAL,
      status: TaskStatus.TODO,
      workload: "4h",
      deliverables: "Schéma de câblage KiCad & relevé de consommation sous charge",
      tags: ["Électronique", "Énergie"],
      dueDate: new Date("2026-10-16T17:00:00.000Z"),
      assignedUser: milane,
      createdByUser: etienne,
      position: 3,
    },
    {
      title: "Dimensionnement du gréement et découpe des laizes de voile",
      description:
        "Calculer la surface de voilure optimale pour la stabilité au vent travers, préparer les gabarits numériques sur Illustrator et réaliser la première découpe dans le tissu spi.",
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      workload: "3h30",
      deliverables: "Plans de voilure côtés & premier jeu de laizes découpées",
      tags: ["Aérodynamique", "Gréement"],
      dueDate: new Date("2026-10-15T17:00:00.000Z"),
      assignedUser: solal,
      createdByUser: etienne,
      position: 4,
    },
    {
      title: "Calibrage de la découpeuse laser et usinage des membrures en contreplaqué",
      description:
        "Valider les paramètres de découpe (vitesse/puissance) sur les plaques de contreplaqué 4mm au Fablab, usiner la série complète des 12 couples de montage et vérifier l'équerrage.",
      priority: TaskPriority.NORMAL,
      status: TaskStatus.TODO,
      workload: "4h",
      deliverables: "Jeu complet des 12 couples découpés & gabarit d'assemblage",
      tags: ["Fabrication", "Fablab"],
      dueDate: new Date("2026-10-16T18:00:00.000Z"),
      assignedUser: peter,
      createdByUser: etienne,
      position: 5,
    },
  ];

  console.log("🚀 Création des 6 tâches de démarrage officielles...");
  for (const t of deploymentTasks) {
    const createdTask = await prisma.task.create({
      data: {
        projectId: project.id,
        createdById: t.createdByUser.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        position: t.position,
        workload: t.workload,
        deliverables: t.deliverables,
        tags: t.tags,
        dueDate: t.dueDate,
      },
    });

    await prisma.taskAssignment.create({
      data: {
        taskId: createdTask.id,
        userId: t.assignedUser.id,
      },
    });

    console.log(`  ✅ [${t.assignedUser.name}] : ${createdTask.title} (Échéance: ${t.dueDate.toISOString().slice(0, 10)})`);
  }

  console.log("🎉 Nettoyage et initialisation des tâches terminés avec succès !");
}

resetTasksForDeployment()
  .catch((err) => {
    console.error("❌ Erreur lors de l'initialisation :", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
