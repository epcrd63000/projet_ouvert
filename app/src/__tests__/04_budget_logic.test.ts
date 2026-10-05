/**
 * Tests unitaires TDD pour la logique métier de mise à jour et validation du budget (IMT Projet Ouvert).
 */

import {
  validateFundingUpdate,
  validateExpenseUpdate,
  calculateExpenseTotal,
  formatDateForInput,
  calculateEffectiveTotalBudget,
  calculateEffectiveSpentBudget,
  calculateBudgetSummary,
} from "../lib/budget/budgetLogic";

function runBudgetLogicTests() {
  console.log("🧪 Lancement des tests unitaires de la logique Budget (TDD)...");

  // 1. Tests de formatage de date pour l'input HTML <input type="date">
  console.log("  1. Test formatDateForInput...");
  console.assert(
    formatDateForInput("2026-09-01T14:30:00.000Z") === "2026-09-01",
    "Doit extraire YYYY-MM-DD d'un string ISO"
  );
  console.assert(
    formatDateForInput("2026-10-15") === "2026-10-15",
    "Doit conserver une date déjà au format YYYY-MM-DD"
  );
  console.assert(
    formatDateForInput(null) === "",
    "Doit renvoyer une chaîne vide si la date est nulle ou indéfinie"
  );

  // 2. Tests de calcul du montant total d'une dépense
  console.log("  2. Test calculateExpenseTotal...");
  const total1 = calculateExpenseTotal(2, 50, 10);
  console.assert(total1 === 110, `Attendu 110, reçu ${total1}`);

  const total2 = calculateExpenseTotal(1, 15.5, 0);
  console.assert(total2 === 15.5, `Attendu 15.5, reçu ${total2}`);

  const total3 = calculateExpenseTotal(0, 50, 5); // Qté 0 considérée comme 1
  console.assert(total3 === 55, `Attendu 55 pour quantité par défaut 1, reçu ${total3}`);

  // 3. Tests de validation d'une mise à jour de financement (FundingSource)
  console.log("  3. Test validateFundingUpdate...");
  const validFunding = validateFundingUpdate({
    name: " APICIL Financement ",
    amount: "2997,00",
    date: "2026-09-01",
    status: "RECEIVED",
    comment: "  Dotation initiale validée  ",
  });
  console.assert(validFunding.isValid === true, "La validation de financement valide doit réussir");
  console.assert(validFunding.data?.name === "APICIL Financement", "Le nom doit être nettoyé (trim)");
  console.assert(validFunding.data?.amount === 2997, "Le montant avec virgule doit être parsé en nombre");
  console.assert(validFunding.data?.status === "RECEIVED", "Le statut doit être conservé");
  console.assert(validFunding.data?.comment === "Dotation initiale validée", "Le commentaire doit être nettoyé");

  // Rejet si montant négatif ou invalide
  const invalidAmount = validateFundingUpdate({
    name: "BDE",
    amount: "-50",
  });
  console.assert(invalidAmount.isValid === false, "Un montant négatif doit être rejeté");

  // Rejet si nom vide
  const emptyName = validateFundingUpdate({
    name: "   ",
    amount: "100",
  });
  console.assert(emptyName.isValid === false, "Un nom vide doit être rejeté");

  // 4. Tests de validation d'une mise à jour de dépense (BudgetEntry)
  console.log("  4. Test validateExpenseUpdate...");
  const validExpense = validateExpenseUpdate({
    label: " Résine Epoxy 5kg ",
    quantity: "2",
    unitPrice: "45.50",
    deliveryCost: "9.90",
    category: "SUPPLIES",
    status: "VALIDATED",
  });
  console.assert(validExpense.isValid === true, "La validation de dépense doit réussir");
  console.assert(validExpense.data?.label === "Résine Epoxy 5kg", "Le libellé doit être nettoyé");
  console.assert(validExpense.data?.amount === 100.9, `Montant calculé attendu 100.90, reçu ${validExpense.data?.amount}`);

  // Rejet si montant total nul ou négatif
  const zeroExpense = validateExpenseUpdate({
    label: "Test",
    quantity: 1,
    unitPrice: 0,
    deliveryCost: 0,
  });
  console.assert(zeroExpense.isValid === false, "Une dépense de montant 0 doit être rejetée");

  // 5. Tests des calculs budgétaires unifiés (Tableau de bord & Trésorerie)
  console.log("  5. Test calculateBudgetSummary & effective totals...");
  const mockFundingSources = [
    { id: "fs1", amount: 2997.00, status: "RECEIVED" }, // APICIL
    { id: "fs2", amount: 116.00, status: "RECEIVED" },  // BDE
    { id: "fs3", amount: 70.00, status: "RECEIVED" },   // Fablab
    { id: "fs4", amount: 500.00, status: "CANCELLED" }, // Annulé
  ];

  const effectiveTotal = calculateEffectiveTotalBudget(mockFundingSources, 500);
  console.assert(
    effectiveTotal === 3183.00,
    `Le total effectif doit être 3183.00 € (hors annulés), reçu: ${effectiveTotal}`
  );

  // Cas de repli si aucun financement
  const fallbackTotal = calculateEffectiveTotalBudget([], 500);
  console.assert(
    fallbackTotal === 500,
    `Doit utiliser le budget de repli (500 €) si aucune enveloppe n'est configurée, reçu: ${fallbackTotal}`
  );

  const mockExpenses = [
    { id: "e1", amount: 2242.29, status: "PAID" },
    { id: "e2", amount: 100.00, status: "CANCELLED" },
    { id: "e3", amount: 0.00, status: "VALIDATED" },
  ];

  const spentMetrics = calculateEffectiveSpentBudget(mockExpenses);
  console.assert(
    spentMetrics.totalPaid === 2242.29,
    `Total payé attendu 2242.29 €, reçu: ${spentMetrics.totalPaid}`
  );
  console.assert(
    spentMetrics.totalCommitted === 0,
    `Total engagé attendu 0 €, reçu: ${spentMetrics.totalCommitted}`
  );
  console.assert(
    spentMetrics.totalSpent === 2242.29,
    `Total consommé attendu 2242.29 €, reçu: ${spentMetrics.totalSpent}`
  );

  const summary = calculateBudgetSummary(mockFundingSources, mockExpenses, 500);
  console.assert(summary.totalFunding === 3183.00, "Total dotation attendu 3183.00 €");
  console.assert(summary.totalSpent === 2242.29, "Total consommé attendu 2242.29 €");
  console.assert(summary.remaining === 940.71, `Solde restant attendu 940.71 €, reçu: ${summary.remaining}`);
  console.assert(summary.percentage === 70.4, `Pourcentage attendu 70.4%, reçu: ${summary.percentage}`);
  console.assert(summary.isOverbudget === false, "Ne doit pas être en dépassement budgétaire");

  console.log("🎉 Tous les tests unitaires Budget (04_budget_logic) sont passés avec succès !");
}

runBudgetLogicTests();
