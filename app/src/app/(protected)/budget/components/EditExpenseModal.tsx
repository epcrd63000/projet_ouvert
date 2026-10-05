"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ShoppingBag } from "lucide-react";
import { BudgetCategory, BudgetEntry, BudgetStatus, FundingSource } from "./types";
import { formatDateForInput, calculateExpenseTotal, validateExpenseUpdate } from "@/lib/budget/budgetLogic";

interface EditExpenseModalProps {
  entry: BudgetEntry | null;
  fundingSources: FundingSource[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (id: string, updates: Partial<BudgetEntry>) => Promise<void>;
}

/**
 * Modale permettant d'éditer une dépense ou achat existant du budget.
 */
export default function EditExpenseModal({
  entry,
  fundingSources,
  isOpen,
  onClose,
  onSaved,
}: EditExpenseModalProps) {
  const [label, setLabel] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("0");
  const [fundingSourceId, setFundingSourceId] = useState("");
  const [category, setCategory] = useState<BudgetCategory>("SUPPLIES");
  const [date, setDate] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<BudgetStatus>("PLANNED");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (entry && isOpen) {
      setLabel(entry.label || "");
      setQuantity(entry.quantity != null ? String(entry.quantity) : "1");
      setUnitPrice(entry.unitPrice != null ? String(entry.unitPrice) : "");
      setDeliveryCost(entry.deliveryCost != null ? String(entry.deliveryCost) : "0");
      setFundingSourceId(entry.fundingSourceId || "");
      setCategory(entry.category || "SUPPLIES");
      setDate(formatDateForInput(entry.date));
      setComment(entry.comment || "");
      setStatus(entry.status || "PLANNED");
      setErrorMessage(null);
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry) return null;

  const currentTotal = calculateExpenseTotal(quantity, unitPrice, deliveryCost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateExpenseUpdate({
      label,
      quantity,
      unitPrice,
      deliveryCost,
      amount: currentTotal,
      date,
      category,
      fundingSourceId,
      status,
      comment,
    });

    if (!validation.isValid || !validation.data) {
      setErrorMessage(validation.error || "Données invalides");
      return;
    }

    setLoading(true);
    try {
      await onSaved(entry.id, validation.data);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage("Une erreur est survenue lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl border w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Modifier la Dépense</h2>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-exp-label">Libellé / Description de l&apos;achat *</Label>
            <Input
              id="edit-exp-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Capteur Ultrason, Roulements inox..."
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-exp-qty">Quantité *</Label>
              <Input
                id="edit-exp-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-exp-price">Prix unitaire (€)</Label>
              <Input
                id="edit-exp-price"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-exp-delivery">Frais de port (€)</Label>
              <Input
                id="edit-exp-delivery"
                type="number"
                step="0.01"
                min="0"
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-md flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total recalculé :</span>
            <span className="font-mono font-bold text-base text-foreground">
              {currentTotal.toFixed(2)} €
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-exp-funding">Enveloppe de financement</Label>
              <select
                id="edit-exp-funding"
                value={fundingSourceId}
                onChange={(e) => setFundingSourceId(e.target.value)}
                className="w-full rounded-md border p-2 text-sm bg-background"
              >
                <option value="">Non affectée</option>
                {fundingSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-exp-cat">Catégorie</Label>
              <select
                id="edit-exp-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as BudgetCategory)}
                className="w-full rounded-md border p-2 text-sm bg-background"
              >
                <option value="SUPPLIES">Fournitures &amp; Matériel</option>
                <option value="SERVICES">Services &amp; Prestations</option>
                <option value="SOFTWARE">Logiciels &amp; Licences</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-exp-date">Date de commande / facture</Label>
              <Input
                id="edit-exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-exp-status">Statut de la dépense</Label>
              <select
                id="edit-exp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BudgetStatus)}
                className="w-full rounded-md border p-2 text-sm bg-background"
              >
                <option value="PLANNED">Planifié</option>
                <option value="VALIDATED">Validé</option>
                <option value="PAID">Payé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-exp-comment">Commentaire / Justificatifs</Label>
            <Input
              id="edit-exp-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Fournisseur, n° devis ou facture, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
