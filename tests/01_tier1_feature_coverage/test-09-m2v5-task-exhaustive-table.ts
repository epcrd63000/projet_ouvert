import { prisma } from "../../app/src/lib/prisma";

async function main() {
  console.log("▶ [Tier 1] Test 1.9: Tableau de bord exhaustif M2V5 et champs enrichis...");

  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error("Aucun utilisateur en base pour exécuter le test.");
  }

  const project = await prisma.project.findFirst();
  if (!project) {
    throw new Error("Aucun projet singleton en base.");
  }

  // 1. Création d'une tâche avec les attributs M2V5
  const task = await prisma.task.create({
    data: {
      title: "Tâche Test TDD M2V5",
      description: "Vérification des colonnes du tableau de bord M2V5",
      status: "TODO",
      priority: "HIGH",
      position: 0,
      projectId: project.id,
      progress: 25,
      workload: "3j/h",
      deliverables: "Spécification technique",
      validationCriteria: "Revue de code par le lead dev",
      delayReason: "Attente retour client",
      createdById: user.id,
    },
  });

  await prisma.taskAssignment.create({
    data: {
      taskId: task.id,
      userId: user.id,
    },
  });

  console.log(`  ✓ Tâche créée avec ID: ${task.id}`);
  console.log(`  ✓ Charge: ${task.workload}`);
  console.log(`  ✓ Livrables: ${task.deliverables}`);
  console.log(`  ✓ Critères de validation: ${task.validationCriteria}`);
  console.log(`  ✓ Avancement: ${task.progress}%`);
  console.log(`  ✓ Cause de retard: ${task.delayReason}`);

  if (
    task.workload !== "3j/h" ||
    task.deliverables !== "Spécification technique" ||
    task.validationCriteria !== "Revue de code par le lead dev" ||
    task.progress !== 25 ||
    task.delayReason !== "Attente retour client"
  ) {
    throw new Error("Échec de la validation des attributs M2V5 sur la tâche créée.");
  }

  // 2. Nettoyage
  await prisma.taskAssignment.deleteMany({ where: { taskId: task.id } });
  await prisma.task.delete({ where: { id: task.id } });
  console.log("  ✓ Nettoyage de la tâche de test effectué avec succès.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur test M2V5:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
