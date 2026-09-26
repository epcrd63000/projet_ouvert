import { prisma } from "../../app/src/lib/prisma";

/**
 * Test T5.2 : Validation des relations de modèles Prisma et cascade delete.
 * Teste la navigation bidirectionnelle, les jointures multi-niveaux et
 * le nettoyage en cascade.
 */
export async function runTest(): Promise<{
  seededMilestonesFound: number;
  deepGraphResolved: boolean;
  cascadeDeleteVerified: boolean;
}> {
  console.log("▶ [Tier 5] Test 5.2: Test approfondi des relations Prisma et intégrité...");

  // 1. Vérification des relations sur les données seedées
  const seededProject = await prisma.project.findFirst({
    include: {
      milestones: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!seededProject) {
    throw new Error("Projet initial introuvable en base.");
  }

  const milestonesCount = seededProject.milestones.length;
  console.log(`  - Jalons liés au projet seedé : ${milestonesCount} (attendu: 11)`);
  if (milestonesCount !== 11) {
    throw new Error(`Incohérence relationnelle : ${milestonesCount} jalons trouvés (11 attendus).`);
  }

  // Vérification de la relation inverse (Milestone -> Project)
  const allMilestonesPointToProject = seededProject.milestones.every(
    (m) => m.project && m.project.id === seededProject.id
  );
  console.log(`  - Relation inverse Milestone -> Project intègre : ${allMilestonesPointToProject}`);
  if (!allMilestonesPointToProject) {
    throw new Error("La relation inverse Milestone.project est rompue ou incomplète.");
  }

  // 2. Construction d'un graphe relationnel complet éphémère
  console.log("  - Création d'un bac à sable relationnel éphémère multi-modèles...");
  const firstUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!firstUser) throw new Error("Aucun utilisateur disponible pour le test.");

  const tempProjectSuffix = `test-${Date.now()}`;
  const testProject = await prisma.project.create({
    data: {
      name: `ADV-PROJECT-${tempProjectSuffix}`,
      description: "Projet de validation des relations Prisma M2",
      totalBudget: 1500,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2027-06-30T00:00:00Z"),
    },
  });

  const testMilestone = await prisma.ganttMilestone.create({
    data: {
      projectId: testProject.id,
      name: "Jalon Test Relations",
      startDate: new Date("2026-11-01T00:00:00Z"),
      endDate: new Date("2026-11-15T00:00:00Z"),
      color: "#10b981",
    },
  });

  const parentTask = await prisma.task.create({
    data: {
      projectId: testProject.id,
      createdById: firstUser.id,
      title: "Tâche Parente Test",
      position: 1,
    },
  });

  const subTask = await prisma.task.create({
    data: {
      projectId: testProject.id,
      createdById: firstUser.id,
      parentId: parentTask.id,
      title: "Sous-tâche Test",
      position: 2,
    },
  });

  const assignment = await prisma.taskAssignment.create({
    data: {
      taskId: parentTask.id,
      userId: firstUser.id,
    },
  });

  const meeting = await prisma.meeting.create({
    data: {
      projectId: testProject.id,
      createdById: firstUser.id,
      title: "Réunion Revue Test",
      scheduledAt: new Date("2026-11-10T14:00:00Z"),
    },
  });

  const attendee = await prisma.meetingAttendee.create({
    data: {
      meetingId: meeting.id,
      userId: firstUser.id,
    },
  });

  const decision = await prisma.meetingDecision.create({
    data: {
      meetingId: meeting.id,
      createdById: firstUser.id,
      content: "Décision test validée",
    },
  });

  const budget = await prisma.budgetEntry.create({
    data: {
      projectId: testProject.id,
      createdById: firstUser.id,
      label: "Achat matériel test",
      amount: 250.5,
      date: new Date("2026-10-15T00:00:00Z"),
      category: "SUPPLIES",
    },
  });

  const event = await prisma.event.create({
    data: {
      projectId: testProject.id,
      createdById: firstUser.id,
      relatedMeetingId: meeting.id,
      relatedMilestoneId: testMilestone.id,
      title: "Événement de test lié",
      startAt: new Date("2026-11-10T14:00:00Z"),
      endAt: new Date("2026-11-10T16:00:00Z"),
    },
  });

  // 3. Requête profonde traversant l'ensemble des relations du graphe
  console.log("  - Exécution d'une requête profonde traversant 8 niveaux de relations...");
  const deepGraph = await prisma.project.findUnique({
    where: { id: testProject.id },
    include: {
      milestones: { include: { events: true } },
      tasks: {
        include: {
          createdBy: true,
          parent: true,
          subTasks: true,
          assignments: { include: { user: true } },
        },
      },
      meetings: {
        include: {
          createdBy: true,
          attendees: { include: { user: true } },
          decisions: { include: { createdBy: true } },
          events: true,
        },
      },
      budgets: { include: { createdBy: true } },
      events: {
        include: {
          createdBy: true,
          relatedMeeting: true,
          relatedMilestone: true,
        },
      },
    },
  });

  if (!deepGraph) throw new Error("Le graphe relationnel n'a pas pu être rechargé.");

  const hasSelfRefTask = deepGraph.tasks.some(
    (t) => t.subTasks.length > 0 && t.subTasks[0].id === subTask.id
  );
  const hasSubTaskParent = deepGraph.tasks.some(
    (t) => t.id === subTask.id && t.parent?.id === parentTask.id
  );
  const hasMeetingDecision = deepGraph.meetings[0]?.decisions[0]?.content === "Décision test validée";
  const hasEventRelations =
    deepGraph.events[0]?.relatedMeeting?.id === meeting.id &&
    deepGraph.events[0]?.relatedMilestone?.id === testMilestone.id;

  const deepGraphResolved =
    hasSelfRefTask && hasSubTaskParent && hasMeetingDecision && hasEventRelations;
  console.log(`  - Résolution intégrale du graphe relationnel : ${deepGraphResolved}`);

  if (!deepGraphResolved) {
    throw new Error("Échec de résolution d'une relation complexe dans le graphe.");
  }

  // 4. Test de suppression en cascade (Cascade Delete)
  console.log("  - Validation du comportement onDelete: Cascade lors de la suppression du projet...");
  await prisma.project.delete({
    where: { id: testProject.id },
  });

  // Vérification de l'absence d'orphelins
  const orphanTasks = await prisma.task.count({ where: { projectId: testProject.id } });
  const orphanMeetings = await prisma.meeting.count({ where: { projectId: testProject.id } });
  const orphanMilestones = await prisma.ganttMilestone.count({ where: { projectId: testProject.id } });
  const orphanBudgets = await prisma.budgetEntry.count({ where: { projectId: testProject.id } });
  const orphanAssignments = await prisma.taskAssignment.count({ where: { taskId: parentTask.id } });
  const orphanDecisions = await prisma.meetingDecision.count({ where: { meetingId: meeting.id } });

  const isCleanCascade =
    orphanTasks === 0 &&
    orphanMeetings === 0 &&
    orphanMilestones === 0 &&
    orphanBudgets === 0 &&
    orphanAssignments === 0 &&
    orphanDecisions === 0;

  console.log(`  - Nettoyage en cascade sans orphelin : ${isCleanCascade}`);
  if (!isCleanCascade) {
    throw new Error("Échec Cascade : Des enregistrements orphelins subsistent après suppression du projet.");
  }

  console.log("  ✓ Relations bidirectionnelles, auto-référencement et cascades validés.");
  return {
    seededMilestonesFound: milestonesCount,
    deepGraphResolved,
    cascadeDeleteVerified: isCleanCascade,
  };
}

if (process.argv[1] && process.argv[1].includes("test-02-schema-relations")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
