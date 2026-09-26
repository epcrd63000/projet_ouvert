import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_PROJECT, SEED_USERS, SEED_MILESTONES } from "./seed-data";

const prisma = new PrismaClient();

/**
 * Script d'initialisation et de peuplement idempotent de la base Neon PostgreSQL.
 */
async function main() {
  console.log("🌱 Démarrage du seed pour le projet IMT...");

  // 1. Génération du hash sécurisé pour le mot de passe initial
  const defaultPassword = "password";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  console.log("  🔒 Hash bcrypt (10 rounds) généré avec succès.");

  // 2. Initialisation ou mise à jour du projet singleton IMT
  const project = await prisma.project.upsert({
    where: { id: SEED_PROJECT.id },
    update: {
      name: SEED_PROJECT.name,
      description: SEED_PROJECT.description,
      totalBudget: SEED_PROJECT.totalBudget,
      startDate: SEED_PROJECT.startDate,
      endDate: SEED_PROJECT.endDate,
    },
    create: {
      id: SEED_PROJECT.id,
      name: SEED_PROJECT.name,
      description: SEED_PROJECT.description,
      totalBudget: SEED_PROJECT.totalBudget,
      startDate: SEED_PROJECT.startDate,
      endDate: SEED_PROJECT.endDate,
    },
  });
  console.log(`  📁 Projet initialisé : "${project.name}" (${project.id})`);

  // 3. Peuplement idempotent des 6 utilisateurs
  console.log("  👥 Enregistrement des 6 utilisateurs officiels...");
  for (const user of SEED_USERS) {
    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
    console.log(`     - [${upsertedUser.role}] ${upsertedUser.name} (${upsertedUser.email})`);
  }

  // 4. Peuplement idempotent des 11 jalons Gantt IMT
  console.log("  📅 Enregistrement des 11 jalons Gantt officiels...");
  for (const milestone of SEED_MILESTONES) {
    const existingMilestone = await prisma.ganttMilestone.findFirst({
      where: {
        name: milestone.name,
        projectId: project.id,
      },
    });

    if (existingMilestone) {
      await prisma.ganttMilestone.update({
        where: { id: existingMilestone.id },
        data: {
          description: milestone.description,
          startDate: milestone.startDate,
          endDate: milestone.endDate,
          color: milestone.color,
          status: milestone.status,
          isPreloaded: milestone.isPreloaded,
        },
      });
    } else {
      await prisma.ganttMilestone.create({
        data: {
          ...milestone,
          projectId: project.id,
        },
      });
    }
  }
  console.log("     ✓ 11 jalons Gantt synchronisés.");

  // 5. Validation finale des volumes
  const userCount = await prisma.user.count();
  const milestoneCount = await prisma.ganttMilestone.count();
  console.log(`\n📊 Bilan : ${userCount} utilisateurs / 6, ${milestoneCount} jalons / 11.`);

  if (userCount !== 6 || milestoneCount !== 11) {
    throw new Error(
      `Anomalie de seed : attendu 6 users et 11 jalons, obtenu ${userCount} users et ${milestoneCount} jalons.`
    );
  }

  console.log("✨ Seeding terminé avec succès !\n");
}

main()
  .catch((error) => {
    console.error("❌ Erreur durant le seeding :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
