import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Script de vérification automatisée de l'état de la base PostgreSQL Neon post-seed.
 */
async function verifyDatabase() {
  console.log("🔍 Démarrage de la vérification de conformité de la base Neon...");

  let hasErrors = false;

  // 1. Contrôle du nombre d'utilisateurs
  const userCount = await prisma.user.count();
  console.log(`\n1. Décompte Utilisateurs : ${userCount} (attendu: 6)`);
  if (userCount !== 6) {
    console.error("   ❌ Échec : Le nombre d'utilisateurs est différent de 6.");
    hasErrors = true;
  } else {
    console.log("   ✅ Succès : Exactement 6 utilisateurs enregistrés.");
  }

  // 2. Contrôle des hashs bcrypt
  const users = await prisma.user.findMany();
  for (const user of users) {
    const isMatch = await bcrypt.compare("password", user.passwordHash);
    if (!isMatch) {
      console.error(`   ❌ Échec : Hash bcrypt non valide pour ${user.email}`);
      hasErrors = true;
    }
  }
  if (!hasErrors) {
    console.log("   ✅ Succès : Tous les utilisateurs possèdent un hash bcrypt valide pour 'password'.");
  }

  // 3. Contrôle des rôles administrateurs
  const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" } });
  const adminEmails = adminUsers.map((a) => a.email).sort();
  if (
    adminEmails.length === 2 &&
    adminEmails[0] === "etienne@imt.fr" &&
    adminEmails[1] === "liam@imt.fr"
  ) {
    console.log("   ✅ Succès : 2 Admins confirmés (etienne@imt.fr, liam@imt.fr).");
  } else {
    console.error("   ❌ Échec : Rôles ADMIN invalides :", adminEmails);
    hasErrors = true;
  }

  // 4. Contrôle du nombre de jalons Gantt
  const milestoneCount = await prisma.ganttMilestone.count();
  console.log(`\n2. Décompte Jalons Gantt : ${milestoneCount} (attendu: 11)`);
  if (milestoneCount !== 11) {
    console.error("   ❌ Échec : Le nombre de jalons est différent de 11.");
    hasErrors = true;
  } else {
    console.log("   ✅ Succès : Exactement 11 jalons Gantt enregistrés.");
  }

  // 5. Contrôle des tables dans le schéma public
  console.log("\n3. Contrôle des tables dans information_schema...");
  const rawTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations'
    ORDER BY table_name ASC;
  `;
  const detectedTables = rawTables.map((t) => t.table_name);
  console.log(`   - Tables détectées (${detectedTables.length}) :`, detectedTables.join(", "));

  const expectedTables = [
    "User", "Project", "Task", "TaskAssignment",
    "Meeting", "MeetingAttendee", "MeetingDecision",
    "GanttMilestone", "BudgetEntry", "Notification", "Event"
  ];

  const lowerDetected = new Set(detectedTables.map((t) => t.toLowerCase()));
  const missingTables = expectedTables.filter((t) => !lowerDetected.has(t.toLowerCase()));

  if (missingTables.length === 0) {
    console.log(`   ✅ Succès : Toutes les ${expectedTables.length} tables du socle sont déployées.`);
  } else {
    console.error("   ❌ Tables manquantes :", missingTables.join(", "));
    hasErrors = true;
  }

  if (hasErrors) {
    console.error("\n❌ Échec de la vérification de la base de données.");
    process.exit(1);
  } else {
    console.log("\n🎉 Tous les critères d'acceptation de la base de données sont 100% validés !");
    process.exit(0);
  }
}

verifyDatabase()
  .catch((err) => {
    console.error("💥 Erreur d'exécution de la vérification :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
