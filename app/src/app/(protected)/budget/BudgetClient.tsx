"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download } from "lucide-react";

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
  createdBy: { name: string; email: string };
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
  const [entries, setEntries] = useState<BudgetEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);

  const used = entries.filter((e) => e.status === "PAID").reduce((sum, e) => sum + e.amount, 0);
  const percentage = totalBudget > 0 ? (used / totalBudget) * 100 : 0;

  const handleExport = () => {
    window.location.href = "/api/budget/export";
  };

  const deleteEntry = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Voulez-vous vraiment supprimer cette dépense &quest;")) return;

    setLoading(true);
    const res = await fetch(`/api/budget/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries(entries.filter((e) => e.id !== id));
    } else {
      alert("Erreur lors de la suppression");
    }
    setLoading(false);
  };

  const addTestEntry = async () => {
    if (!isAdmin) return;
    setLoading(true);
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: "Nouvelle dépense",
        amount: 50,
        date: new Date().toISOString(),
        category: "SUPPLIES",
        status: "PLANNED",
      }),
    });
    if (res.ok) {
      window.location.reload();
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (!isAdmin) return;
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
        {isAdmin ? (
          <Button onClick={addTestEntry} disabled={loading}>+ Ajouter une dépense</Button>
        ) : (
          <div></div>
        )}
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
              {isAdmin && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="p-4 text-center text-muted-foreground">
                  Aucune dépense trouvée.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="p-3 font-medium">{entry.label}</td>
                  <td className="p-3">{entry.quantity ?? "-"}</td>
                  <td className="p-3">{entry.unitPrice != null ? entry.unitPrice.toFixed(2) + " €" : "-"}</td>
                  <td className="p-3">{entry.deliveryCost != null ? entry.deliveryCost.toFixed(2) + " €" : "-"}</td>
                  <td className="p-3 font-semibold">{entry.amount.toFixed(2)} €</td>
                  <td className="p-3 whitespace-nowrap">{format(new Date(entry.date), "dd MMM yyyy", { locale: fr })}</td>
                  <td className="p-3">{entry.category}</td>
                  <td className="p-3">
                    {isAdmin ? (
                      <select
                        value={entry.status}
                        onChange={(e) => updateStatus(entry.id, e.target.value)}
                        className="p-1 rounded bg-background border"
                        disabled={loading}
                      >
                        <option value="PLANNED">Planifié</option>
                        <option value="VALIDATED">Validé</option>
                        <option value="PAID">Payé</option>
                      </select>
                    ) : (
                      entry.status
                    )}
                  </td>
                  {isAdmin && (
                    <td className="p-3 text-right">
                      <Button variant="destructive" size="sm" onClick={() => deleteEntry(entry.id)} disabled={loading}>
                        Suppr.
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
