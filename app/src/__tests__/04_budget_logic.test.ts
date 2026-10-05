/**
 * Tests unitaires TDD pour la logique métier de mise à jour et validation du budget (IMT Projet Ouvert).
 */

import {
  validateFundingUpdate,
  validateExpenseUpdate,
  calculateExpenseTotal,
  formatDateForInput,
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

  console.log("🎉 Tous les tests unitaires Budget (04_budget_logic) sont passés avec succès !");
}

runBudgetLogicTests();
