import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FundingSource, BudgetEntry } from "./types";
import { Wallet, TrendingUp, PiggyBank, ArrowDownRight } from "lucide-react";
import { calculateBudgetSummary } from "@/lib/budget/budgetCalculations";

interface BudgetSummaryCardsProps {
  fundingSources: FundingSource[];
  expenses: BudgetEntry[];
}

/**
 * Composant affichant les KPIs synthétiques et la balance financière par enveloppe (APICIL, BDE, Fablab).
 */
export default function BudgetSummaryCards({
  fundingSources,
  expenses,
}: BudgetSummaryCardsProps) {
  // Calcul unifié des montants actifs et KPIs financiers
  const { totalFunding, totalPaid, totalCommitted, totalSpent, remaining, percentage } =
    calculateBudgetSummary(fundingSources, expenses);

  const activeExpenses = expenses.filter((e) => e.status !== "CANCELLED");

  return (
    <div className="space-y-4">
      {/* Carte globale principale */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Trésorerie Globale du Projet
            </CardTitle>
            <Badge variant={remaining >= 0 ? "secondary" : "destructive"}>
              {remaining >= 0 ? "Solde Positif" : "Déficit"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Fonds Disponibles</p>
              <p className="text-2xl font-bold text-emerald-600">{totalFunding.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Dépenses Réalisées (Payées)</p>
              <p className="text-2xl font-bold text-amber-600">{totalPaid.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Dépenses Engagées (Validées)</p>
              <p className="text-2xl font-bold text-blue-600">{totalCommitted.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Solde Restant Réel</p>
              <p className={`text-2xl font-bold ${remaining >= 0 ? "text-primary" : "text-destructive"}`}>
                {remaining.toFixed(2)} €
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Consommation globale du budget ({percentage.toFixed(1)}%)</span>
              <span>{totalSpent.toFixed(2)} € / {totalFunding.toFixed(2)} €</span>
            </div>
            <Progress value={Math.min(percentage, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Cartes par Enveloppe de Financement (APICIL, BDE, Fablab...) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fundingSources.map((source) => {
          const isCancelled = source.status === "CANCELLED";
          const sourceExpenses = activeExpenses.filter((e) => e.fundingSourceId === source.id);
          const sourceSpent = sourceExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
          const sourceAmount = Number(source.amount);
          const sourceRemaining = sourceAmount - sourceSpent;
          const sourcePercent = sourceAmount > 0 ? (sourceSpent / sourceAmount) * 100 : 0;

          return (
            <Card
              key={source.id}
              className={`transition-all ${
                isCancelled ? "opacity-50 border-dashed bg-muted/20" : "bg-card shadow-sm"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-1.5">
                      <PiggyBank className="h-4 w-4 text-primary" />
                      {source.name}
                    </h4>
                    {source.comment && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={source.comment}>
                        {source.comment}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      source.status === "RECEIVED"
                        ? "default"
                        : source.status === "PENDING"
                        ? "outline"
                        : "destructive"
                    }
                    className="text-[10px] px-1.5 py-0.5"
                  >
                    {source.status === "RECEIVED"
                      ? "Encaissé"
                      : source.status === "PENDING"
                      ? "Attendu"
                      : "Annulé"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                  <div>
                    <span className="text-muted-foreground">Dotation :</span>{" "}
                    <span className="font-medium">{sourceAmount.toFixed(2)} €</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Consommé :</span>{" "}
                    <span className="font-medium">{sourceSpent.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Solde restant :</span>
                  <span className={sourceRemaining >= 0 ? "text-emerald-600" : "text-destructive"}>
                    {sourceRemaining.toFixed(2)} €
                  </span>
                </div>

                {!isCancelled && (
                  <Progress value={Math.min(sourcePercent, 100)} className="h-1.5" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
