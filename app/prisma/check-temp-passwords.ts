import "dotenv/config";
import prisma from "../src/lib/prisma";
import { isTempPasswordActive } from "../src/lib/auth/tempPasswordCheck";
import { extractUserPseudo, formatTempPasswordExpiry } from "../src/lib/auth/credentialsLogic";

/**
 * Vérifie que chaque mot de passe temporaire affiché à l'administrateur
 * (et donc envoyé par mail) correspond bien au hash réellement utilisé à la connexion.
 *
 * Un écart signifie que le mail contient un mot de passe qui ne fonctionne pas :
 * c'est exactement le bug qui avait bloqué toute l'équipe.
 *
 * Usage : npx tsx prisma/check-temp-passwords.ts
 * Code retour : 0 si tout est cohérent, 1 sinon.
 */
async function main() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  console.log("\n🔎 Contrôle des mots de passe temporaires (affiché ↔ hash actif)\n");

  let stale = 0;
  let active = 0;
  let personalized = 0;

  for (const user of users) {
    const login = extractUserPseudo(user.name);

    if (!user.tempPassword) {
      personalized++;
      console.log(`   · ${user.name.padEnd(16)} (${login}) — personnalisé, aucun mot de passe temporaire`);
      continue;
    }

    const ok = await isTempPasswordActive(user.tempPassword, user.passwordHash);
    const expiry = formatTempPasswordExpiry(user.tempPasswordExpiresAt) ?? "sans échéance";

    if (ok) {
      active++;
      console.log(`   ✅ ${user.name.padEnd(16)} (${login}) — valide jusqu'au ${expiry}`);
    } else {
      stale++;
      console.error(`   ❌ ${user.name.padEnd(16)} (${login}) — le mot de passe affiché NE correspond PAS au compte`);
    }
  }

  console.log(
    `\n📊 Bilan : ${active} valide(s), ${stale} obsolète(s), ${personalized} personnalisé(s).`
  );

  if (stale > 0) {
    console.error("\n❌ Au moins un mot de passe temporaire est désynchronisé : ne pas l'envoyer par mail.");
    process.exitCode = 1;
  } else {
    console.log("\n✅ Tous les mots de passe temporaires affichés fonctionnent.\n");
  }
}

main()
  .catch((error) => {
    console.error("💥 Erreur durant le contrôle :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
