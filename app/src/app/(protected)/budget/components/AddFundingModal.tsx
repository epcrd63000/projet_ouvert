"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Landmark } from "lucide-react";
import { FundingSource, FundingStatus } from "./types";

interface AddFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (source: FundingSource) => void;
}

/**
 * Modale permettant d'ajouter une nouvelle source de financement / apport de trésorerie ("qui se rajoute").
 */
export default function AddFundingModal({
  isOpen,
  onClose,
  onCreated,
}: AddFundingModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<FundingStatus>("RECEIVED");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Veuillez saisir un libellé valide et un montant supérieur à 0");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/budget/funding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: parsedAmount,
          date: new Date(date).toISOString(),
          comment: comment.trim() || undefined,
          status,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onCreated(created);
        setName("");
        setAmount("");
        setComment("");
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création du financement");
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
          <Landmark className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Ajouter un Financement</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="f-name">Nom de la source / Partenaire *</Label>
            <Input
              id="f-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sponsor Décathlon, Don Particulier, Subvention Région"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="f-amount">Montant (€) *</Label>
              <Input
                id="f-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500.00"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-date">Date d&apos;octroi *</Label>
              <Input
                id="f-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="f-status">Statut de la rentrée</Label>
            <select
              id="f-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as FundingStatus)}
              className="w-full rounded-md border p-2 text-sm bg-background"
            >
              <option value="RECEIVED">Encaissé / Disponible</option>
              <option value="PENDING">Promis / En attente de virement</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="f-comment">Commentaire / Conditions</Label>
            <Input
              id="f-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Détails sur l'utilisation imposée ou justificatifs..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Enregistrer le financement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
