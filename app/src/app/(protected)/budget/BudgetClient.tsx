"use client";

import React, { useState } from "react";
import { BudgetEntry, FundingSource } from "./components/types";
import BudgetSummaryCards from "./components/BudgetSummaryCards";
import FundingSourcesTable from "./components/FundingSourcesTable";
import ExpensesTable from "./components/ExpensesTable";
import AddFundingModal from "./components/AddFundingModal";
import AddExpenseModal from "./components/AddExpenseModal";

interface BudgetClientProps {
  initialEntries: any[];
  initialFundingSources: any[];
  totalBudget: number;
  isAdmin: boolean;
}

/**
 * Composant racine du Suivi Budgétaire MINIMOCA.
 * Orchestre les cartes de synthèse, la gestion des financements et le tableau des dépenses.
 */
export default function BudgetClient({
  initialEntries,
  initialFundingSources,
  isAdmin,
}: BudgetClientProps) {
  const [entries, setEntries] = useState<BudgetEntry[]>(
    initialEntries.map((e) => ({ ...e, amount: Number(e.amount) }))
  );
  const [fundingSources, setFundingSources] = useState<FundingSource[]>(
    initialFundingSources.map((s) => ({ ...s, amount: Number(s.amount) }))
  );

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  // Mettre à jour une dépense (statut, source, commentaire...)
  const handleUpdateEntry = async (id: string, updates: Partial<BudgetEntry>) => {
    try {
      const res = await fetch(`/api/budget/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...updated, amount: Number(updated.amount) } : e))
        );
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la mise à jour de la dépense");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  // Supprimer une dépense
  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette dépense ?")) return;
    try {
      const res = await fetch(`/api/budget/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  // Mettre à jour une source de financement (statut "qui s'annule", commentaire...)
  const handleUpdateSource = async (id: string, updates: Partial<FundingSource>) => {
    try {
      const res = await fetch(`/api/budget/funding/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setFundingSources((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updated, amount: Number(updated.amount) } : s))
        );
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la modification de la source");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  // Supprimer une source de financement
  const handleDeleteSource = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette enveloppe de financement ?")) return;
    try {
      const res = await fetch(`/api/budget/funding/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFundingSources((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const handleExportCsv = () => {
    window.location.href = "/api/budget/export";
  };

  return (
    <div className="space-y-8">
      {/* 1. KPIs et balances par enveloppe */}
      <BudgetSummaryCards fundingSources={fundingSources} expenses={entries} />

      {/* 2. Tableau des ressources & financements ("quel argent on a") */}
      <FundingSourcesTable
        sources={fundingSources}
        isAdmin={isAdmin}
        onUpdateSource={handleUpdateSource}
        onDeleteSource={handleDeleteSource}
        onOpenAddModal={() => setIsFundingModalOpen(true)}
      />

      {/* 3. Tableau des dépenses & achats */}
      <ExpensesTable
        entries={entries}
        fundingSources={fundingSources}
        isAdmin={isAdmin}
        onUpdateEntry={handleUpdateEntry}
        onDeleteEntry={handleDeleteEntry}
        onOpenAddModal={() => setIsExpenseModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* Modale d'ajout d'une source de financement */}
      <AddFundingModal
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
        onCreated={(source) => setFundingSources((prev) => [...prev, source])}
      />

      {/* Modale d'ajout d'une dépense */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        fundingSources={fundingSources}
        onClose={() => setIsExpenseModalOpen(false)}
        onCreated={(entry) => setEntries((prev) => [entry, ...prev])}
      />
    </div>
  );
}
