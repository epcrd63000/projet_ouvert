import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!project || !admin) {
    console.error("No project or admin found");
    return;
  }

  const expenses = [
    // Grément
    { label: "Tubes carbone Kingson 6mmx82,5cm", q: 1, u: 7.90, d: 0, t: 7.90, cat: "SUPPLIES" },
    { label: "Poulie inox racing 8mm double", q: 7, u: 13.21, d: 6.90, t: 99.37, cat: "SUPPLIES" },
    { label: "Poulie inox racing 8mm simple", q: 1, u: 10.40, d: 0, t: 10.40, cat: "SUPPLIES" },
    { label: "Tube laiton pour passe coque", q: 1, u: 5.96, d: 0, t: 5.96, cat: "SUPPLIES" },
    // Matelotage
    { label: "anneaux brisés inox 6 mm", q: 2, u: 1.97, d: 0, t: 3.94, cat: "SUPPLIES" },
    { label: "Dacron toronné 1.2 mm bobine", q: 2, u: 5.76, d: 0, t: 11.52, cat: "SUPPLIES" },
    { label: "Tissus Icarex 31gr/m2", q: 3, u: 23.70, d: 0, t: 71.10, cat: "SUPPLIES" },
    { label: "Bobine de 800m - Fil couture", q: 1, u: 9.50, d: 0, t: 9.50, cat: "SUPPLIES" },
    { label: "Dacron pour renfort de voile", q: 2, u: 1.90, d: 0, t: 3.80, cat: "SUPPLIES" },
    { label: "Autocollant Double face 6mm", q: 1, u: 7.90, d: 0, t: 7.90, cat: "SUPPLIES" },
    { label: "Jonc carbone 3x1500mm", q: 2, u: 8.50, d: 0, t: 17.00, cat: "SUPPLIES" },
    { label: "PETG-CF BambuLab", q: 1, u: 36.29, d: 10.00, t: 46.29, cat: "SUPPLIES" },
    { label: "Dyneema 2 mm 1 m", q: 30, u: 0.55, d: 10.90, t: 27.40, cat: "SUPPLIES" },
    { label: "Dyneema 1 mm bobine", q: 1, u: 36.30, d: 0, t: 36.30, cat: "SUPPLIES" },
    // Bulbe
    { label: "Plomb", q: 2, u: 18.90, d: 0, t: 37.80, cat: "SUPPLIES" },
    { label: "Silicone", q: 3, u: 26.58, d: 42.56, t: 122.30, cat: "SUPPLIES" },
    { label: "vaseline", q: 1, u: 5.84, d: 0, t: 5.84, cat: "SUPPLIES" },
    { label: "casserole et brûleur", q: 1, u: 48.98, d: 0, t: 48.98, cat: "SUPPLIES" },
    { label: "talc", q: 1, u: 13.29, d: 0, t: 13.29, cat: "SUPPLIES" },
    { label: "gants", q: 1, u: 15.19, d: 0, t: 15.19, cat: "SUPPLIES" },
    { label: "bac", q: 1, u: 24.96, d: 0, t: 24.96, cat: "SUPPLIES" },
    { label: "bonbonne de gaz", q: 1, u: 29.12, d: 0, t: 29.12, cat: "SUPPLIES" },
    // Électronique
    { label: "RADIO FUTABA 6K V3S", q: 1, u: 257.00, d: 0, t: 257.00, cat: "OTHER" },
    { label: "Servo direction Savöx", q: 1, u: 36.90, d: 0, t: 36.90, cat: "OTHER" },
    { label: "Servo réglages Treuil Brushless", q: 2, u: 145.00, d: 0, t: 290.00, cat: "OTHER" },
    { label: "Accumulateur Nimh A2 Pro", q: 2, u: 34.96, d: 0, t: 69.92, cat: "OTHER" },
    { label: "Pile Alcaline LR06", q: 4, u: 1.25, d: 0, t: 5.00, cat: "SUPPLIES" },
    // Coque
    { label: "Bois Médium", q: 8, u: 43.19, d: 69.13, t: 414.65, cat: "SUPPLIES" },
    { label: "Gelcoat", q: 5, u: 15.82, d: 15.87, t: 94.97, cat: "SUPPLIES" },
    { label: "Résine époxy", q: 3, u: 32.79, d: 19.67, t: 118.04, cat: "SUPPLIES" },
    { label: "Plomb de plongée", q: 2, u: 15.00, d: 0, t: 36.00, cat: "SUPPLIES" }, // 2*15=30 + 6 delivery
    // Matériels assemblage
    { label: "axe linéaire cylindrique", q: 1, u: 9.87, d: 0, t: 9.87, cat: "SUPPLIES" },
    { label: "lot de pointes à souder", q: 1, u: 11.99, d: 0, t: 11.99, cat: "SUPPLIES" },
    { label: "lot de 2 buses", q: 1, u: 5.99, d: 0, t: 5.99, cat: "SUPPLIES" },
    { label: "PETG Filament en Fibre Carbone", q: 2, u: 38.99, d: 0, t: 77.98, cat: "SUPPLIES" },
    { label: "colle epoxy + superglue", q: 1, u: 34.78, d: 0, t: 34.78, cat: "SUPPLIES" },
    { label: "colle epoxy bi-composante", q: 2, u: 10.90, d: 0, t: 21.80, cat: "SUPPLIES" },
    // Divers
    { label: "Nourriture apéro fin d'année", q: 1, u: 31.61, d: 0, t: 31.61, cat: "OTHER" },
    { label: "Masque de protection FFP2", q: 1, u: 4.50, d: 0, t: 4.50, cat: "SUPPLIES" },
    { label: "commande amazon", q: 1, u: 65.43, d: 0, t: 65.43, cat: "OTHER" },
  ];

  await prisma.budgetEntry.deleteMany({}); // Clear existing

  for (const exp of expenses) {
    await prisma.budgetEntry.create({
      data: {
        projectId: project.id,
        createdById: admin.id,
        label: exp.label,
        quantity: exp.q,
        unitPrice: exp.u,
        deliveryCost: exp.d,
        amount: exp.t,
        category: exp.cat as any,
        date: new Date(),
        status: "PAID",
      }
    });
  }

  console.log("Budget seeded successfully");
}

main().catch(console.error);
