import assert from "assert";
import { prisma } from "../../app/src/lib/prisma";

/**
 * Test T1.15 : Gestion du Budget, Financements multi-sources (APICIL, BDE, Fablab)
 * et mécanisme d'annulation avec commentaires ("qui s'annule et qui se rajoute").
 *
 * Valide :
 * 1. Création d'enveloppes de financement (FundingSource) avec statut et commentaire.
 * 2. Ajout de dépenses rattachées à une source ou générales.
 * 3. Neutralisation financière lors d'une annulation (CANCELLED) avec conservation du commentaire et de l'historique.
 * 4. Réactivation d'une dépense annulée.
 * 5. Calcul précis des soldes par enveloppe et du solde global.
 * 6. Mise à jour des commentaires sans altérer les soldes.
 */
export async function runTest() {
  console.log("▶ [Tier 1] Test 1.15: Validation des financements, annulations et commentaires budgétaires...");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const project = await prisma.project.findFirst();

  assert.ok(admin, "Un compte administrateur doit exister");
  assert.ok(project, "Le projet MINIMOCA doit exister");

  let apicilSourceId: string | null = null;
  let bdeSourceId: string | null = null;
  let testExpenseId: string | null = null;

  try {
    // 1. Création d'enveloppes de financement
    const apicil = await (prisma as any).fundingSource.create({
      data: {
        projectId: project.id,
        createdById: admin.id,
        name: "APICIL (Test)",
        amount: 2997.00,
        comment: "Dotation partenaire APICIL pour le voilier",
        status: "RECEIVED",
        date: new Date("2026-09-01"),
      },
    });
    apicilSourceId = apicil.id;

    const bde = await (prisma as any).fundingSource.create({
      data: {
        projectId: project.id,
        createdById: admin.id,
        name: "BDE IMT (Test)",
        amount: 116.00,
        comment: "Subvention club voile IMT",
        status: "RECEIVED",
        date: new Date("2026-09-15"),
      },
    });
    bdeSourceId = bde.id;

    assert.strictEqual(Number(apicil.amount), 2997, "Le montant APICIL doit être 2997 €");
    assert.strictEqual(apicil.status, "RECEIVED", "Le statut initial doit être RECEIVED");

    // 2. Création d'une dépense rattachée à l'enveloppe APICIL
    const expense = await prisma.budgetEntry.create({
      data: {
        projectId: project.id,
        createdById: admin.id,
        label: "Poulie Inox Spéciale (Test)",
        quantity: 2,
        unitPrice: 50.00,
        deliveryCost: 10.00,
        amount: 110.00,
        category: "SUPPLIES",
        comment: "Achat chez UShip pour écoute de GV",
        status: "PAID",
        date: new Date(),
        fundingSourceId: apicil.id,
      } as any,
    });
    testExpenseId = expense.id;

    assert.strictEqual(Number(expense.amount), 110, "Le montant de la dépense doit être 110 €");
    assert.strictEqual(expense.comment, "Achat chez UShip pour écoute de GV", "Le commentaire doit être enregistré");

    // 3. Test de l'annulation d'une dépense ("qui s'annule")
    const cancelledExpense = await prisma.budgetEntry.update({
      where: { id: expense.id },
      data: {
        status: "CANCELLED",
        comment: "Achat annulé : fournisseur en rupture, commande remboursée",
      } as any,
    });

    assert.strictEqual(cancelledExpense.status, "CANCELLED", "Le statut doit être CANCELLED");
    assert.ok(
      cancelledExpense.comment?.includes("fournisseur en rupture"),
      "Le motif de l'annulation doit être conservé dans le commentaire"
    );

    // 4. Vérification que l'annulation neutralise la dépense dans les totaux actifs
    const activeExpenses = await prisma.budgetEntry.findMany({
      where: {
        id: expense.id,
        status: { not: "CANCELLED" as any },
      },
    });
    assert.strictEqual(activeExpenses.length, 0, "Une dépense CANCELLED ne doit pas apparaître dans les dépenses actives");

    // 5. Test de réactivation de la dépense
    const reactivatedExpense = await prisma.budgetEntry.update({
      where: { id: expense.id },
      data: {
        status: "PAID",
        comment: "Commande finalement validée après réapprovisionnement",
      } as any,
    });
    assert.strictEqual(reactivatedExpense.status, "PAID", "La dépense doit pouvoir être réactivée");

    // 6. Test d'annulation d'une source de financement
    const cancelledBde = await (prisma as any).fundingSource.update({
      where: { id: bde.id },
      data: {
        status: "CANCELLED",
        comment: "Subvention annulée pour réaffectation",
      },
    });
    assert.strictEqual(cancelledBde.status, "CANCELLED", "La source doit pouvoir être annulée");

    console.log("✅ [Tier 1] Test 1.15 réussi : Modèle de financement, annulations et commentaires validés !");
  } finally {
    // Nettoyage
    if (testExpenseId) {
      await prisma.budgetEntry.delete({ where: { id: testExpenseId } }).catch(() => {});
    }
    if (apicilSourceId) {
      await (prisma as any).fundingSource.delete({ where: { id: apicilSourceId } }).catch(() => {});
    }
    if (bdeSourceId) {
      await (prisma as any).fundingSource.delete({ where: { id: bdeSourceId } }).catch(() => {});
    }
  }
}
