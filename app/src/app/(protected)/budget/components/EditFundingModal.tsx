"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Landmark } from "lucide-react";
import { FundingSource, FundingStatus } from "./types";
import { formatDateForInput, validateFundingUpdate } from "@/lib/budget/budgetLogic";

interface EditFundingModalProps {
  source: FundingSource | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (id: string, updates: Partial<FundingSource>) => Promise<void>;
}

/**
 * Modale permettant d'éditer une source de financement / apport existant.
 */
export default function EditFundingModal({
  source,
  isOpen,
  onClose,
  onSaved,
}: EditFundingModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<FundingStatus>("RECEIVED");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (source && isOpen) {
      setName(source.name || "");
      setAmount(source.amount != null ? String(source.amount) : "");
      setDate(formatDateForInput(source.date));
      setStatus(source.status || "RECEIVED");
      setComment(source.comment || "");
      setErrorMessage(null);
    }
  }, [source, isOpen]);

  if (!isOpen || !source) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateFundingUpdate({
      name,
      amount,
      date,
      status,
      comment,
    });

    if (!validation.isValid || !validation.data) {
      setErrorMessage(validation.error || "Données invalides");
      return;
    }

    setLoading(true);
    try {
      await onSaved(source.id, validation.data);
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
      <div className="bg-background rounded-lg shadow-xl border w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Landmark className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Modifier le Financement</h2>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-f-name">Source / Partenaire *</Label>
            <Input
              id="edit-f-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: APICIL, BDE IMT Nord Europe, Fablab"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-f-amount">Montant Alloué (€) *</Label>
              <Input
                id="edit-f-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2997.00"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-f-date">Date *</Label>
              <Input
                id="edit-f-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-f-status">Statut</Label>
            <select
              id="edit-f-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as FundingStatus)}
              className="w-full rounded-md border p-2 text-sm bg-background"
            >
              <option value="RECEIVED">Encaissé</option>
              <option value="PENDING">Attendu / Promis</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-f-comment">Commentaire / Justificatifs</Label>
            <Input
              id="edit-f-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Détails, conditions ou référence..."
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
