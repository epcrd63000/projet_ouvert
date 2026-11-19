import "dotenv/config";
import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateSecurePassword,
  extractUserPseudo,
  matchUserIdentifier,
} from "../src/lib/auth/credentialsLogic";

/**
 * Régénère un mot de passe temporaire pour un ou plusieurs membres.
 *
 * Utile lorsque le mot de passe d'origine est inconnu (colonne `tempPassword` vide)
 * ou lorsque le membre a égaré ses accès. Le nouveau mot de passe est actif
 * immédiatement et expire au bout de 30 jours (paramétrable).
 *
 * Usage :
 *   npx tsx prisma/regenerate-temp-passwords.ts --users=liam,peter --dry-run
 *   npx tsx prisma/regenerate-temp-passwords.ts --users=liam,peter
 *   npx tsx prisma/regenerate-temp-passwords.ts --all --days=30
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const all = args.includes("--all");
  const usersArg = args.find((a) => a.startsWith("--users="));
  const daysArg = args.find((a) => a.startsWith("--days="));
  const days = daysArg ? Number.parseInt(daysArg.split("=")[1], 10) : 30;

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("Valeur invalide pour --days (entier positif attendu).");
  }
  if (!all && !usersArg) {
    throw new Error("Préciser --users=prénom1,prénom2 ou --all.");
  }

  const identifiers = usersArg
    ? usersArg
        .split("=")[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return { dryRun, all, identifiers, days };
}

async function main() {
  const { dryRun, all, identifiers, days } = parseArgs();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  console.log(`\n🔑 Régénération de mots de passe temporaires${dryRun ? " (SIMULATION)" : ""}`);
  console.log(`   Échéance : ${expiresAt.toLocaleDateString("fr-FR")}\n`);

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const targets = all
    ? users
    : users.filter((u) => identifiers.some((id) => matchUserIdentifier(u, id)));

  const unresolved = identifiers.filter(
    (id) => !targets.some((u) => matchUserIdentifier(u, id))
  );

  if (unresolved.length > 0) {
    console.warn(`   ⚠️  Identifiant(s) non résolu(s) : ${unresolved.join(", ")}\n`);
  }
  if (targets.length === 0) {
    throw new Error("Aucun utilisateur à traiter.");
  }

  for (const user of targets) {
    const newTempPassword = generateSecurePassword(10);

    if (!dryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await bcrypt.hash(newTempPassword, 10),
          tempPassword: newTempPassword,
          tempPasswordExpiresAt: expiresAt,
        },
      });
    }

    console.log(
      `   ✅ ${user.name.padEnd(16)} | login: ${extractUserPseudo(user.name).padEnd(8)} | mot de passe: ${dryRun ? "(simulé)" : newTempPassword}`
    );
  }

  console.log(`\n📊 ${targets.length} compte(s) traité(s).`);
  if (dryRun) console.log("ℹ️  Simulation : aucune écriture en base.\n");
  else console.log("⚠️  Transmettre ces mots de passe en privé, jamais dans un groupe.\n");
}

main()
  .catch((error) => {
    console.error("❌ Erreur :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
