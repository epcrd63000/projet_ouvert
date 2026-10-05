"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ShoppingBag } from "lucide-react";
import { BudgetCategory, BudgetEntry, BudgetStatus, FundingSource } from "./types";

interface AddExpenseModalProps {
  isOpen: boolean;
  fundingSources: FundingSource[];
  onClose: () => void;
  onCreated: (entry: BudgetEntry) => void;
}

/**
 * Modale de saisie d'une nouvelle dépense rattachée à une enveloppe budgétaire avec commentaire.
 */
export default function AddExpenseModal({
  isOpen,
  fundingSources,
  onClose,
  onCreated,
}: AddExpenseModalProps) {
  const [label, setLabel] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("0");
  const [fundingSourceId, setFundingSourceId] = useState<string>(
    fundingSources[0]?.id || ""
  );
  const [category, setCategory] = useState<BudgetCategory>("SUPPLIES");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<BudgetStatus>("PLANNED");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const qty = Number(quantity) || 1;
  const price = parseFloat(unitPrice) || 0;
  const delivery = parseFloat(deliveryCost) || 0;
  const calculatedTotal = qty * price + delivery;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedTotal <= 0) {
      alert("Le montant total calculé doit être supérieur à 0");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          quantity: qty,
          unitPrice: price > 0 ? price : undefined,
          deliveryCost: delivery > 0 ? delivery : undefined,
          amount: calculatedTotal,
          date: new Date(date).toISOString(),
          category,
          fundingSourceId: fundingSourceId || undefined,
          comment: comment.trim() || undefined,
          status,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onCreated(created);
        setLabel("");
        setQuantity(1);
        setUnitPrice("");
        setDeliveryCost("0");
        setComment("");
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création de la dépense");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl border w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Nouvelle Dépense</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="e-label">Libellé de l&apos;achat *</Label>
            <Input
              id="e-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Poulie inox double, Jonc carbone..."
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="e-qty">Quantité</Label>
              <Input
                id="e-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="e-price">Prix unit. (€) *</Label>
              <Input
                id="e-price"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="10.00"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="e-ship">Livraison (€)</Label>
              <Input
                id="e-ship"
                type="number"
                step="0.01"
                min="0"
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="e-source">Source de financement</Label>
              <select
                id="e-source"
                value={fundingSourceId}
                onChange={(e) => setFundingSourceId(e.target.value)}
                className="w-full rounded-md border p-2 text-sm bg-background"
              >
                <option value="">Non affectée</option>
                {fundingSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({Number(s.amount).toFixed(0)} €)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="e-cat">Catégorie</Label>
              <select
                id="e-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as BudgetCategory)}
                className="w-full rounded-md border p-2 text-sm bg-background"
              >
                <option value="SUPPLIES">Fournitures</option>
                <option value="SERVICES">Services</option>
                <option value="SOFTWARE">Logiciels</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="e-date">Date *</Label>
              <Input
                id="e-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="e-status">Statut</Label>
              <select
                id="e-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BudgetStatus)}
                className="w-full rounded-md border p-2 text-sm bg-background"
              >
                <option value="PLANNED">Planifié</option>
                <option value="VALIDATED">Validé (Engagé)</option>
                <option value="PAID">Payé (Effectué)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="e-comment">Commentaire / Justificatif</Label>
            <Input
              id="e-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Lien marchand, référence produit, etc."
            />
          </div>

          <div className="p-2.5 bg-muted rounded-md text-sm flex justify-between items-center">
            <span className="text-muted-foreground">Total calculé :</span>
            <span className="font-bold text-base">{calculatedTotal.toFixed(2)} €</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Enregistrer la dépense"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
