import { prisma } from "../src/lib/prisma";

/**
 * Script de réconciliation des assignations de tâches existantes :
 * Assigne toute tâche orpheline d'assignation à son créateur (createdById).
 */
async function repairTaskAssignments() {
  console.log("🔧 Vérification et réparation des assignations de tâches...");

  const tasksWithoutAssignments = await prisma.task.findMany({
    where: {
      assignments: {
        none: {},
      },
      createdById: {
        not: null,
      },
    },
    include: {
      createdBy: true,
    },
  });

  console.log(`📋 Tâches sans assignation trouvées : ${tasksWithoutAssignments.length}`);

  for (const task of tasksWithoutAssignments) {
    if (task.createdById) {
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          userId: task.createdById,
        },
      });
      console.log(`  ✓ Tâche "${task.title}" (${task.id}) assignée à ${task.createdBy?.name || task.createdById}`);
    }
  }

  console.log("✅ Réparation terminée avec succès.");
}

repairTaskAssignments()
  .catch((err) => {
    console.error("❌ Erreur réparation :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
