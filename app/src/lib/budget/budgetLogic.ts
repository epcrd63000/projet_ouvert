/**
 * Module de logique métier pour la gestion et la validation du budget (IMT Projet Ouvert).
 * Gère les calculs de totaux, la validation des montants et la normalisation des données.
 */

import { FundingStatus, BudgetStatus, BudgetCategory } from "@/app/(protected)/budget/components/types";

export interface FundingUpdatePayload {
  name?: string;
  amount?: number | string;
  date?: string | Date | null;
  status?: FundingStatus;
  comment?: string | null;
}

export interface ExpenseUpdatePayload {
  label?: string;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  deliveryCost?: number | string | null;
  amount?: number | string;
  date?: string | Date | null;
  category?: BudgetCategory;
  fundingSourceId?: string | null;
  comment?: string | null;
  status?: BudgetStatus;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  error?: string;
}

/**
 * Formate une date quelconque (ISO string, objet Date) au format YYYY-MM-DD requis par <input type="date">.
 */
export function formatDateForInput(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return "";
  try {
    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Calcule le montant total d'une dépense : (quantité * prix unitaire) + frais de port.
 */
export function calculateExpenseTotal(
  quantity: number | string | null | undefined,
  unitPrice: number | string | null | undefined,
  deliveryCost: number | string | null | undefined
): number {
  const qtyNum = Number(quantity);
  const qty = isNaN(qtyNum) || qtyNum <= 0 ? 1 : Math.floor(qtyNum);
  
  const priceNum = typeof unitPrice === "string" ? parseFloat(unitPrice.replace(",", ".")) : Number(unitPrice);
  const price = isNaN(priceNum) || priceNum < 0 ? 0 : priceNum;

  const deliveryNum = typeof deliveryCost === "string" ? parseFloat(deliveryCost.replace(",", ".")) : Number(deliveryCost);
  const delivery = isNaN(deliveryNum) || deliveryNum < 0 ? 0 : deliveryNum;

  const total = qty * price + delivery;
  return Math.round(total * 100) / 100;
}

/**
 * Valide et normalise les données de mise à jour d'un financement (FundingSource).
 */
export function validateFundingUpdate(
  payload: FundingUpdatePayload
): ValidationResult<{
  name: string;
  amount: number;
  date: string;
  status: FundingStatus;
  comment: string | null;
}> {
  const name = (payload.name || "").trim();
  if (!name) {
    return { isValid: false, error: "Le nom de la source ou du partenaire est requis" };
  }

  const rawAmount = typeof payload.amount === "string" 
    ? parseFloat(payload.amount.replace(",", ".")) 
    : Number(payload.amount);

  if (isNaN(rawAmount) || rawAmount <= 0) {
    return { isValid: false, error: "Le montant alloué doit être un nombre positif" };
  }

  const amount = Math.round(rawAmount * 100) / 100;

  let isoDate = new Date().toISOString();
  if (payload.date) {
    const d = new Date(payload.date);
    if (!isNaN(d.getTime())) {
      isoDate = d.toISOString();
    }
  }

  const status: FundingStatus = payload.status || "RECEIVED";
  const comment = payload.comment && payload.comment.trim() ? payload.comment.trim() : null;

  return {
    isValid: true,
    data: {
      name,
      amount,
      date: isoDate,
      status,
      comment,
    },
  };
}

/**
 * Valide et normalise les données de mise à jour d'une dépense (BudgetEntry).
 */
export function validateExpenseUpdate(
  payload: ExpenseUpdatePayload
): ValidationResult<{
  label: string;
  quantity: number;
  unitPrice: number;
  deliveryCost: number;
  amount: number;
  date: string;
  category: BudgetCategory;
  fundingSourceId: string | null;
  status: BudgetStatus;
  comment: string | null;
}> {
  const label = (payload.label || "").trim();
  if (!label) {
    return { isValid: false, error: "Le libellé de la dépense est requis" };
  }

  const qtyNum = Number(payload.quantity);
  const quantity = isNaN(qtyNum) || qtyNum <= 0 ? 1 : Math.floor(qtyNum);

  const priceNum = typeof payload.unitPrice === "string" 
    ? parseFloat(payload.unitPrice.replace(",", ".")) 
    : Number(payload.unitPrice);
  const unitPrice = isNaN(priceNum) || priceNum < 0 ? 0 : Math.round(priceNum * 100) / 100;

  const deliveryNum = typeof payload.deliveryCost === "string"
    ? parseFloat(payload.deliveryCost.replace(",", "."))
    : Number(payload.deliveryCost);
  const deliveryCost = isNaN(deliveryNum) || deliveryNum < 0 ? 0 : Math.round(deliveryNum * 100) / 100;

  const calculatedTotal = calculateExpenseTotal(quantity, unitPrice, deliveryCost);
  const amount = payload.amount !== undefined 
    ? (typeof payload.amount === "string" ? parseFloat(payload.amount.replace(",", ".")) : Number(payload.amount))
    : calculatedTotal;

  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, error: "Le montant total de la dépense doit être supérieur à 0 €" };
  }

  let isoDate = new Date().toISOString();
  if (payload.date) {
    const d = new Date(payload.date);
    if (!isNaN(d.getTime())) {
      isoDate = d.toISOString();
    }
  }

  const category: BudgetCategory = payload.category || "SUPPLIES";
  const status: BudgetStatus = payload.status || "PLANNED";
  const fundingSourceId = payload.fundingSourceId && payload.fundingSourceId.trim() !== "" ? payload.fundingSourceId : null;
  const comment = payload.comment && payload.comment.trim() ? payload.comment.trim() : null;

  return {
    isValid: true,
    data: {
      label,
      quantity,
      unitPrice,
      deliveryCost,
      amount,
      date: isoDate,
      category,
      fundingSourceId,
      status,
      comment,
    },
  };
}
