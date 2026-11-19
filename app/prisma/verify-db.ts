import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { SEED_USERS } from "./seed-data";

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

  // 2. Contrôle des hashs bcrypt et de la cohérence des mots de passe temporaires
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (!/^\$2[aby]\$\d{2}\$/.test(user.passwordHash)) {
      console.error(`   ❌ Échec : hash bcrypt invalide pour ${user.email}`);
      hasErrors = true;
      continue;
    }

    // Un mot de passe temporaire affiché à l'admin doit correspondre au hash actif,
    // sinon l'administrateur distribue un mot de passe qui ne fonctionne pas.
    if (user.tempPassword && !(await bcrypt.compare(user.tempPassword, user.passwordHash))) {
      console.warn(`   ⚠️  Mot de passe temporaire désynchronisé pour ${user.email} (compte personnalisé ?)`);
    }
  }
  if (!hasErrors) {
    console.log("   ✅ Succès : Tous les utilisateurs possèdent un hash bcrypt valide.");
  }

  // 3. Contrôle des rôles administrateurs (référence : seed-data.ts)
  const expectedAdmins = SEED_USERS.filter((u) => u.role === "ADMIN")
    .map((u) => u.email)
    .sort();
  const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" } });
  const adminEmails = adminUsers.map((a) => a.email).sort();
  if (
    adminEmails.length === expectedAdmins.length &&
    adminEmails.every((email, i) => email === expectedAdmins[i])
  ) {
    console.log(`   ✅ Succès : ${expectedAdmins.length} Admins confirmés (${expectedAdmins.join(", ")}).`);
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
    SELECT CAST(table_name AS text) as table_name
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
    "GanttMilestone", "BudgetEntry", "FundingSource", "Notification", "Event",
    "AiPrompt", "ImportantInfo", "UserActivityLog", "ProjectLink"
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
