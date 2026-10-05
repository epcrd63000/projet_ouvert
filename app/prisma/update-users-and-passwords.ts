import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { generateSecurePassword } from "../src/lib/auth/credentialsLogic";

const TARGET_USERS = [
  {
    firstName: "etienne",
    name: "Etienne PICARD",
    email: "etienne.picard@etu.imt-nord-europe.fr",
    role: "ADMIN" as const,
  },
  {
    firstName: "liam",
    name: "Liam BEAN",
    email: "liam.bean@etu.imt-nord-europe.fr",
    role: "ADMIN" as const,
  },
  {
    firstName: "hugo",
    name: "Hugo RAMPAZZO",
    email: "hugo.rampazzo@etu.imt-nord-europe.fr",
    role: "MEMBER" as const,
  },
  {
    firstName: "milane",
    name: "Milane FARGUES",
    email: "milane.fargues@etu.imt-nord-europe.fr",
    role: "MEMBER" as const,
  },
  {
    firstName: "solal",
    name: "Solal BENQADI",
    email: "solal.benqadi@etu.imt-nord-europe.fr",
    role: "MEMBER" as const,
  },
  {
    firstName: "peter",
    name: "Peter BATLLO",
    email: "peter.batllo@etu.imt-nord-europe.fr",
    role: "MEMBER" as const,
  },
];

async function updateUsers() {
  console.log("🔄 Mise à jour des comptes utilisateurs et génération des mots de passe...");

  const existingUsers = await prisma.user.findMany();
  console.log(`Trouvé ${existingUsers.length} utilisateurs en base.`);

  for (const target of TARGET_USERS) {
    // Retrouver l'utilisateur existant par son prénom ou son email ancien
    const existing = existingUsers.find((u) => {
      const uFirst = u.name.split(" ")[0].toLowerCase();
      const uEmail = u.email.toLowerCase();
      return uFirst === target.firstName || uEmail.startsWith(target.firstName);
    });

    const tempPassword = generateSecurePassword(10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: target.name,
          email: target.email,
          role: target.role,
          passwordHash,
          tempPassword,
        },
      });
      console.log(`✅ Mis à jour : ${updated.name} (${updated.email})`);
      console.log(`   👤 Pseudo: ${target.firstName} | 🔑 Mot de passe: ${tempPassword}`);
    } else {
      const created = await prisma.user.create({
        data: {
          name: target.name,
          email: target.email,
          role: target.role,
          passwordHash,
          tempPassword,
        },
      });
      console.log(`✨ Créé : ${created.name} (${created.email})`);
      console.log(`   👤 Pseudo: ${target.firstName} | 🔑 Mot de passe: ${tempPassword}`);
    }
  }

  console.log("🎉 Tous les comptes sont synchronisés avec leurs mots de passe aléatoires !");
}

updateUsers()
  .catch((err) => {
    console.error("Erreur lors de la mise à jour :", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
