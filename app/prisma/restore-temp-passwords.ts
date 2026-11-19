import "dotenv/config";
import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Restauration des mots de passe temporaires perdus.
 *
 * Contexte : le script `seed.ts` a réécrit le `passwordHash` de tous les comptes
 * avec le mot de passe par défaut (« password ») sans mettre à jour
 * `tempPassword`. Résultat : l'espace admin affichait un mot de passe temporaire
 * qui ne correspondait plus au hash réellement stocké.
 *
 * Ce script réactive le mot de passe temporaire affiché à l'administrateur
 * uniquement pour les membres qui ne l'ont jamais personnalisé, puis fixe une
 * échéance (30 jours par défaut).
 *
 * Usage :
 *   npx tsx prisma/restore-temp-passwords.ts --dry-run
 *   npx tsx prisma/restore-temp-passwords.ts --days=30
 */

const SEED_DEFAULT_PASSWORD = "password";

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const daysArg = args.find((a) => a.startsWith("--days="));
  const days = daysArg ? Number.parseInt(daysArg.split("=")[1], 10) : 30;

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("Valeur invalide pour --days (entier positif attendu).");
  }

  return { dryRun, days };
}

async function main() {
  const { dryRun, days } = parseArgs();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  console.log(`\n🔐 Restauration des mots de passe temporaires${dryRun ? " (SIMULATION)" : ""}`);
  console.log(`   Échéance appliquée : ${expiresAt.toLocaleDateString("fr-FR")} (J+${days})\n`);

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const restored: string[] = [];
  const skipped: string[] = [];

  for (const user of users) {
    // Aucun mot de passe temporaire connu : compte personnalisé ou créé autrement.
    if (!user.tempPassword) {
      skipped.push(`${user.name} — aucun mot de passe temporaire connu (compte personnalisé)`);
      continue;
    }

    const tempIsActive = await bcrypt.compare(user.tempPassword, user.passwordHash);
    const stillSeedDefault = await bcrypt.compare(SEED_DEFAULT_PASSWORD, user.passwordHash);

    if (tempIsActive) {
      console.log(`   ⏭️  ${user.name} — mot de passe temporaire déjà actif`);
      skipped.push(`${user.name} — déjà actif`);
      continue;
    }

    if (!stillSeedDefault) {
      console.log(`   ⏭️  ${user.name} — mot de passe personnalisé, aucune modification`);
      skipped.push(`${user.name} — mot de passe personnalisé`);
      continue;
    }

    if (!dryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await bcrypt.hash(user.tempPassword, 10),
          tempPasswordExpiresAt: expiresAt,
        },
      });
    }

    restored.push(`${user.name} — mot de passe temporaire réactivé jusqu'au ${expiresAt.toLocaleDateString("fr-FR")}`);
    console.log(`   ✅ ${user.name} — mot de passe temporaire réactivé`);
  }

  console.log(`\n📊 Bilan : ${restored.length} compte(s) restauré(s), ${skipped.length} ignoré(s).`);
  for (const line of restored) console.log(`   + ${line}`);
  for (const line of skipped) console.log(`   · ${line}`);

  if (dryRun) {
    console.log("\nℹ️  Simulation terminée : aucune écriture en base (relancer sans --dry-run).");
  }
  console.log("");
}

main()
  .catch((error) => {
    console.error("❌ Erreur durant la restauration :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
