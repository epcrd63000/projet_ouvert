import { prisma } from "../src/lib/prisma";

async function main() {
  const project = await prisma.project.findFirst();
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!project) {
    console.error("Projet introuvable");
    return;
  }

  const count = await prisma.fundingSource.count();
  if (count === 0) {
    const apicil = await prisma.fundingSource.create({
      data: {
        projectId: project.id,
        createdById: admin?.id,
        name: "APICIL",
        amount: 2997.00,
        comment: "Enveloppe initiale fournie par le groupe APICIL au début du projet",
        status: "RECEIVED",
        date: new Date("2026-09-01"),
      },
    });

    await prisma.fundingSource.create({
      data: {
        projectId: project.id,
        createdById: admin?.id,
        name: "BDE IMT Nord Europe",
        amount: 116.00,
        comment: "Subvention du Bureau des Élèves (BDE) pour l'année",
        status: "RECEIVED",
        date: new Date("2026-09-10"),
      },
    });

    await prisma.fundingSource.create({
      data: {
        projectId: project.id,
        createdById: admin?.id,
        name: "Fablab IMT Nord Europe",
        amount: 70.00,
        comment: "Dotation consommables au fablab IMT pour cette année",
        status: "RECEIVED",
        date: new Date("2026-09-15"),
      },
    });

    // Associer les dépenses existantes à APICIL par défaut (compatibilité Neon HTTP)
    const existingEntries = await prisma.budgetEntry.findMany({ select: { id: true } });
    for (const entry of existingEntries) {
      await prisma.budgetEntry.update({
        where: { id: entry.id },
        data: { fundingSourceId: apicil.id },
      });
    }

    console.log("✅ Enveloppes MINIMOCA (APICIL, BDE, Fablab) seedées avec succès !");
  } else {
    console.log("ℹ️ Des sources de financement existent déjà.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
