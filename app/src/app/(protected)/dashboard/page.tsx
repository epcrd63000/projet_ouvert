import React from "react";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChartIcon, AlertTriangle, Hourglass } from "lucide-react";
import prisma from "@/lib/prisma";
import {
  MemberProgressChart,
  WorkloadChart,
  BudgetGauge,
  MilestoneProgress,
} from "@/components/dashboard/DashboardCharts";
import {
  calculateGlobalMetrics,
  calculateMemberProgress,
  calculateWorkload,
  calculatePersonalSummary,
} from "@/lib/dashboard/dashboardMetrics";
import {
  calculateEffectiveTotalBudget,
  calculateEffectiveSpentBudget,
} from "@/lib/budget/budgetCalculations";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  // Récupération des données réelles depuis PostgreSQL Neon
  const [
    allTasks,
    allUsers,
    milestones,
    budgetEntries,
    fundingSources,
    project,
    nextMeeting
  ] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    prisma.ganttMilestone.findMany({ select: { id: true, name: true, status: true } }),
    prisma.budgetEntry.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { id: true, amount: true, status: true },
    }),
    prisma.fundingSource.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { id: true, amount: true, status: true },
    }),
    prisma.project.findFirst({ select: { id: true, totalBudget: true } }),
    prisma.meeting.findFirst({
      where: { scheduledAt: { gt: new Date() } },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  // Calcul du budget effectif basé sur les dotations réelles (APICIL, BDE, Fablab) avec repli projet
  const fallbackBudget = Number(project?.totalBudget) || 0;
  const effectiveTotalBudget = calculateEffectiveTotalBudget(
    fundingSources as any,
    fallbackBudget
  );

  // Seules les dépenses actives (payées et engagées) consomment le budget
  const consumedEntries = budgetEntries.filter(
    (e) => e.status === "PAID" || e.status === "VALIDATED"
  );

  // Calculs via les modules utilitaires dédiés
  const globalMetrics = calculateGlobalMetrics(
    allTasks as any,
    milestones as any,
    consumedEntries as any,
    effectiveTotalBudget
  );

  const progressByMember = calculateMemberProgress(allUsers, allTasks as any);
  const workloadByMember = calculateWorkload(allUsers, allTasks as any);
  const personalSummary = calculatePersonalSummary(user.id, allTasks as any);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour {user.name} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suivi opérationnel du Projet Ouvert IMT CI1 (2026-2027) — Voilier MINIMOCA.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-xs font-semibold text-muted-foreground mr-0.5">Mes tâches assignées :</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              🎯 {personalSummary.totalAssigned} assignée{personalSummary.totalAssigned > 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">
              ⏳ {personalSummary.inProgress} en cours
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
              ✅ {personalSummary.done} terminée{personalSummary.done > 1 ? "s" : ""}
            </Badge>
            {personalSummary.totalAssigned > 0 && (
              <Badge variant="secondary" className="text-xs font-medium">
                📊 {personalSummary.completionRate}% de vos tâches
              </Badge>
            )}
            {personalSummary.late > 0 && (
              <Badge variant="destructive" className="text-xs">
                ⚠️ {personalSummary.late} en retard
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Avancement Global</CardTitle>
              <p className="text-[11px] text-muted-foreground">Toute l&apos;équipe (Projet)</p>
            </div>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {globalMetrics.doneTasks} / {globalMetrics.totalTasks} tâches de l&apos;équipe terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tâches en retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${globalMetrics.lateTasks > 0 ? "text-red-500" : "text-green-500"}`}>
              {globalMetrics.lateTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {globalMetrics.lateTasks === 0 ? "Tout est dans les temps" : "À traiter en priorité"}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prochaine réunion</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextMeeting ? (
              <>
                <div className="text-2xl font-bold">
                  {formatDistanceToNow(new Date(nextMeeting.scheduledAt), { addSuffix: true, locale: fr })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextMeeting.title}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">Aucune</div>
                <p className="text-xs text-muted-foreground">Pas de réunion planifiée</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
        <MemberProgressChart data={progressByMember} />
        <MilestoneProgress
          achieved={globalMetrics.achievedMilestones}
          remaining={globalMetrics.remainingMilestones}
        />
        <WorkloadChart data={workloadByMember} />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
        <BudgetGauge
          total={globalMetrics.totalBudget}
          used={globalMetrics.usedBudget}
          remaining={globalMetrics.remainingBudget}
        />
      </div>
    </div>
  );
}
