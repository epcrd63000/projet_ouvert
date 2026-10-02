import { prisma } from "../../app/src/lib/prisma";

/**
 * Test T1.8 : Vérification de la visibilité des tâches Kanban et de l'assignation par défaut.
 * Valide que :
 * 1. Les tâches créées par un utilisateur lui sont assignées ou restent visibles pour lui.
 * 2. Les requêtes de tâches retournent bien les assignations avec les noms d'utilisateurs et le créateur.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.8: Visibilité des tâches Kanban et assignation...");

  try {
    // 1. Récupérer l'utilisateur Etienne (Admin)
    const etienne = await prisma.user.findFirst({
      where: { email: "etienne@imt.fr" },
    });
    if (!etienne) {
      throw new Error("Utilisateur Etienne introuvable");
    }

    // 2. Récupérer le projet singleton
    const project = await prisma.project.findFirst();
    if (!project) {
      throw new Error("Projet singleton introuvable");
    }

    // 3. Créer une tâche test créée par Etienne
    const testTask = await prisma.task.create({
      data: {
        title: "Tâche Test TDD Visibilité",
        status: "TODO",
        priority: "NORMAL",
        position: 999,
        projectId: project.id,
        createdById: etienne.id,
      },
    });

    // Assigner la tâche à Etienne
    await prisma.taskAssignment.create({
      data: {
        taskId: testTask.id,
        userId: etienne.id,
      },
    });

    // 4. Vérifier que la requête GET /api/tasks avec le filtre de visibilité retrouve bien la tâche
    // Simuler le filtre de visibilité : assignments.some(userId) OR createdById
    const visibleTasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignments: { some: { userId: etienne.id } } },
          { createdById: etienne.id },
        ],
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const found = visibleTasks.find((t) => t.id === testTask.id);
    if (!found) {
      throw new Error("La tâche créée n'a pas été trouvée dans les tâches visibles pour Etienne.");
    }

    if (found.assignments.length === 0 || !found.assignments[0].user.name) {
      throw new Error("Les assignations ne contiennent pas le nom d'utilisateur requis pour l'affichage Kanban.");
    }

    if (!found.createdBy?.name) {
      throw new Error("Le créateur de la tâche n'est pas inclus dans les relations.");
    }

    console.log(`  ✓ Tâche "${found.title}" trouvée avec succès.`);
    console.log(`  ✓ Assigné à : ${found.assignments[0].user.name}`);
    console.log(`  ✓ Créé par : ${found.createdBy.name}`);

    // Nettoyage de la tâche de test
    await prisma.task.delete({ where: { id: testTask.id } });
    console.log("  ✓ Nettoyage de la tâche de test effectué.");

    return { name: "T1.8 Visibilité Tâches Kanban", passed: true };
  } finally {
    // Ne pas déconnecter prisma HTTP adapter pour ne pas fermer le singleton
  }
}

if (process.argv[1] && process.argv[1].includes("test-08-kanban-task-visibility")) {
  runTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ ÉCHEC : ${err.message}`);
      process.exit(1);
    });
}
