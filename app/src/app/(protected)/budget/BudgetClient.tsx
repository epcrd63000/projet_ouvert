"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Plus, Trash2, X } from "lucide-react";

type BudgetEntry = {
  id: string;
  label: string;
  quantity: number | null;
  unitPrice: number | null;
  deliveryCost: number | null;
  amount: number;
  date: Date;
  category: "SUPPLIES" | "SERVICES" | "SOFTWARE" | "OTHER";
  status: "PLANNED" | "VALIDATED" | "PAID";
  createdBy: { name: string; email: string } | null;
};

export default function BudgetClient({
  initialEntries,
  totalBudget,
  isAdmin,
}: {
  initialEntries: any[];
  totalBudget: number;
  isAdmin: boolean;
}) {
  const [entries, setEntries] = useState<BudgetEntry[]>(
    initialEntries.map((e) => ({ ...e, amount: Number(e.amount) }))
  );
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulaire d'ajout
  const [newLabel, setNewLabel] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [newDeliveryCost, setNewDeliveryCost] = useState("0");
  const [newCategory, setNewCategory] = useState<"SUPPLIES" | "SERVICES" | "SOFTWARE" | "OTHER">("SUPPLIES");
  const [newComment, setNewComment] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  const used = entries
    .filter((e) => e.status === "PAID")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const percentage = totalBudget > 0 ? (used / totalBudget) * 100 : 0;

  const handleExport = () => {
    window.location.href = "/api/budget/export";
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette dépense ?")) return;

    setLoading(true);
    const res = await fetch(`/api/budget/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries(entries.filter((e) => e.id !== id));
    } else {
      alert("Erreur lors de la suppression");
    }
    setLoading(false);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(newQuantity) || 1;
    const unitPrice = parseFloat(newUnitPrice) || 0;
    const delivery = parseFloat(newDeliveryCost) || 0;
    const calculatedAmount = qty * unitPrice + delivery;

    if (calculatedAmount <= 0) {
      alert("Le montant total calculé doit être supérieur à 0");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel,
          quantity: qty,
          unitPrice: unitPrice > 0 ? unitPrice : undefined,
          deliveryCost: delivery > 0 ? delivery : undefined,
          amount: calculatedAmount,
          date: new Date(newDate).toISOString(),
          category: newCategory,
          comment: newComment || undefined,
          status: "PLANNED",
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setEntries([created, ...entries]);
        setIsModalOpen(false);
        // Reset form
        setNewLabel("");
        setNewQuantity(1);
        setNewUnitPrice("");
        setNewDeliveryCost("0");
        setNewComment("");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setLoading(true);
    const res = await fetch(`/api/budget/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEntries(entries.map((e) => (e.id === id ? { ...e, status: updated.status } : e)));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget Consommé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-2">
            <span>
              Total: {totalBudget.toFixed(2)} € | Consommé: {used.toFixed(2)} € | Reste: {(totalBudget - used).toFixed(2)} €
            </span>
            <span className="font-bold">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-4" />
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button onClick={() => setIsModalOpen(true)} className="gap-2" disabled={loading}>
          <Plus className="h-4 w-4" /> Ajouter une dépense
        </Button>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground whitespace-nowrap">
            <tr>
              <th className="p-3">Libellé</th>
              <th className="p-3">Quantité</th>
              <th className="p-3">Prix unitaire</th>
              <th className="p-3">Livraison</th>
              <th className="p-3">Montant Total</th>
              <th className="p-3">Date</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Statut</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center text-muted-foreground">
                  Aucune dépense trouvée.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="p-3 font-medium">{entry.label}</td>
                  <td className="p-3">{entry.quantity ?? "-"}</td>
                  <td className="p-3">{entry.unitPrice != null ? Number(entry.unitPrice).toFixed(2) + " €" : "-"}</td>
                  <td className="p-3">{entry.deliveryCost != null ? Number(entry.deliveryCost).toFixed(2) + " €" : "-"}</td>
                  <td className="p-3 font-semibold">{Number(entry.amount).toFixed(2)} €</td>
                  <td className="p-3 whitespace-nowrap">{format(new Date(entry.date), "dd MMM yyyy", { locale: fr })}</td>
                  <td className="p-3">{entry.category}</td>
                  <td className="p-3">
                    <select
                      value={entry.status}
                      onChange={(e) => updateStatus(entry.id, e.target.value)}
                      className="p-1 rounded bg-background border text-xs"
                      disabled={loading}
                    >
                      <option value="PLANNED">Planifié</option>
                      <option value="VALIDATED">Validé</option>
                      <option value="PAID">Payé</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modale d'ajout d'une dépense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl border w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Nouvelle Dépense</h2>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="b-label">Libellé *</Label>
                <Input
                  id="b-label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex: Cartes Arduino Nano"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="b-qty">Quantité</Label>
                  <Input
                    id="b-qty"
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="b-price">Prix unitaire (€)</Label>
                  <Input
                    id="b-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    placeholder="12.50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="b-ship">Livraison (€)</Label>
                  <Input
                    id="b-ship"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newDeliveryCost}
                    onChange={(e) => setNewDeliveryCost(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="b-cat">Catégorie</Label>
                  <select
                    id="b-cat"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-md border p-2 text-sm bg-background"
                  >
                    <option value="SUPPLIES">Fournitures (SUPPLIES)</option>
                    <option value="SERVICES">Services (SERVICES)</option>
                    <option value="SOFTWARE">Logiciels (SOFTWARE)</option>
                    <option value="OTHER">Autre (OTHER)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="b-date">Date</Label>
                  <Input
                    id="b-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="b-comment">Commentaire</Label>
                <Input
                  id="b-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Lien marchand ou détails..."
                />
              </div>

              <div className="p-3 bg-muted rounded-md text-sm">
                Montant total calculé :{" "}
                <span className="font-bold">
                  {(
                    (Number(newQuantity) || 1) * (parseFloat(newUnitPrice) || 0) +
                    (parseFloat(newDeliveryCost) || 0)
                  ).toFixed(2)}{" "}
                  €
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
