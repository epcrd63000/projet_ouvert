/**
 * Module de calculs et de métriques pour le budget et la trésorerie (Projet MINIMOCA).
 * Assure la cohérence des indicateurs financiers entre le tableau de bord et la page de trésorerie.
 */

export interface FundingSourceCalculationItem {
  id?: string;
  amount: number | string;
  status: "RECEIVED" | "PENDING" | "CANCELLED" | string;
}

export interface BudgetEntryCalculationItem {
  id?: string;
  amount: number | string;
  status: "PLANNED" | "VALIDATED" | "PAID" | "CANCELLED" | string;
}

export interface BudgetCalculationSummary {
  totalFunding: number;
  totalPaid: number;
  totalCommitted: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  isOverbudget: boolean;
}

/**
 * Calcule le total effectif des dotations et financements disponibles.
 * Exclut les financements annulés (CANCELLED).
 * Bascule sur le budget projet configuré si aucune enveloppe de financement active n'existe.
 */
export function calculateEffectiveTotalBudget(
  fundingSources: FundingSourceCalculationItem[] = [],
  fallbackProjectBudget: number = 0
): number {
  const activeSources = fundingSources.filter((s) => s.status !== "CANCELLED");
  if (activeSources.length === 0) {
    return Math.max(0, fallbackProjectBudget);
  }
  const sum = activeSources.reduce((acc, s) => acc + Number(s.amount || 0), 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Calcule les dépenses actives consommées (réalisées/payées et engagées/validées).
 * Exclut rigoureusement les dépenses annulées (CANCELLED).
 */
export function calculateEffectiveSpentBudget(
  entries: BudgetEntryCalculationItem[] = []
): {
  totalPaid: number;
  totalCommitted: number;
  totalSpent: number;
} {
  const activeEntries = entries.filter((e) => e.status !== "CANCELLED");

  const totalPaid = activeEntries
    .filter((e) => e.status === "PAID")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalCommitted = activeEntries
    .filter((e) => e.status === "VALIDATED")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalSpent = totalPaid + totalCommitted;

  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalCommitted: Math.round(totalCommitted * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
  };
}

/**
 * Calcule la synthèse budgétaire complète (KPIs du tableau de bord et de la page budget).
 */
export function calculateBudgetSummary(
  fundingSources: FundingSourceCalculationItem[] = [],
  entries: BudgetEntryCalculationItem[] = [],
  fallbackProjectBudget: number = 0
): BudgetCalculationSummary {
  const totalFunding = calculateEffectiveTotalBudget(fundingSources, fallbackProjectBudget);
  const { totalPaid, totalCommitted, totalSpent } = calculateEffectiveSpentBudget(entries);

  const remaining = Math.round((totalFunding - totalSpent) * 100) / 100;
  const percentage = totalFunding > 0 ? Math.round((totalSpent / totalFunding) * 1000) / 10 : 0;
  const isOverbudget = totalSpent > totalFunding;

  return {
    totalFunding,
    totalPaid,
    totalCommitted,
    totalSpent,
    remaining,
    percentage,
    isOverbudget,
  };
}
