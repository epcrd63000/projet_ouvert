"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Activity, Users, AlertCircle } from "lucide-react";
import { ActivitySummaryMetrics } from "@/lib/dashboard/adminActivityMetrics";

interface ActivitySummaryCardsProps {
  summary: ActivitySummaryMetrics;
}

/**
 * Cartes d'indicateurs de synthèse de l'engagement de l'équipe pour la semaine.
 */
export function ActivitySummaryCards({ summary }: ActivitySummaryCardsProps) {
  const {
    mostActiveMember,
    averageActivity,
    inactiveMembersCount,
    totalWeeklyInteractions,
  } = summary;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Top Contributeur</CardTitle>
            <p className="text-[11px] text-muted-foreground">Plus forte implication</p>
          </div>
          <div className="p-2 bg-amber-500/10 rounded-full text-amber-500">
            <Trophy className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {mostActiveMember && mostActiveMember.totalActivity > 0
              ? mostActiveMember.name
              : "Aucune activité"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mostActiveMember && mostActiveMember.totalActivity > 0
              ? `${mostActiveMember.totalActivity} interaction(s) (${mostActiveMember.visitsCount} visites, ${mostActiveMember.actionsCount} actions)`
              : "Aucun membre connecté cette semaine"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <p className="text-[11px] text-muted-foreground">Volume hebdomadaire</p>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
            <Activity className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {totalWeeklyInteractions}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cumul des connexions et actions de l&apos;équipe
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Moyenne / Membre</CardTitle>
            <p className="text-[11px] text-muted-foreground">Activité par étudiant</p>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            {averageActivity}{" "}
            <span className="text-xs font-normal text-muted-foreground">act./membre</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Indicateur de dynamique collective
          </p>
        </CardContent>
      </Card>

      <Card className={inactiveMembersCount > 0 ? "border-amber-500/40 bg-amber-500/5" : ""}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Membres Sans Activité</CardTitle>
            <p className="text-[11px] text-muted-foreground">Alerte décrochage</p>
          </div>
          <div
            className={`p-2 rounded-full ${
              inactiveMembersCount > 0
                ? "bg-red-500/10 text-red-500"
                : "bg-emerald-500/10 text-emerald-500"
            }`}
          >
            <AlertCircle className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-xl font-bold ${
              inactiveMembersCount > 0 ? "text-red-500" : "text-emerald-500"
            }`}
          >
            {inactiveMembersCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {inactiveMembersCount === 0
              ? "Tous les membres ont été actifs !"
              : "Étudiant(s) sans visite ni action cette semaine"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
