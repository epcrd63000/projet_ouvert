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
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const isAdmin = user.role === "ADMIN";

  // Fetch real data from Prisma
  const [
    allTasks,
    allUsers,
    milestones,
    budgetEntries,
    project,
    nextMeeting
  ] = await Promise.all([
    prisma.task.findMany({ include: { assignments: { include: { user: true } } } }),
    prisma.user.findMany(),
    prisma.ganttMilestone.findMany(),
    prisma.budgetEntry.findMany({ where: { status: "PAID" } }),
    prisma.project.findFirst(),
    prisma.meeting.findFirst({
      where: { scheduledAt: { gt: new Date() } },
      orderBy: { scheduledAt: 'asc' }
    })
  ]);

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.status === "DONE").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const lateTasks = allTasks.filter(t => t.status !== "DONE" && t.dueDate && t.dueDate < new Date()).length;

  const achievedMilestones = milestones.filter(m => m.status === "ACHIEVED").length;
  const remainingMilestones = milestones.length - achievedMilestones;

  const totalBudget = project?.totalBudget || 0;
  const usedBudget = budgetEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // Group data by user
  const progressByMember = allUsers.map(u => {
    const userTasks = allTasks.filter(t => t.assignments.some(a => a.userId === u.id));
    return {
      name: u.name,
      done: userTasks.filter(t => t.status === "DONE").length,
      total: userTasks.length
    };
  });

  const workloadByMember = allUsers.map(u => {
    const userTasks = allTasks.filter(t => t.assignments.some(a => a.userId === u.id));
    return {
      name: u.name,
      inProgress: userTasks.filter(t => t.status === "IN_PROGRESS").length
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue sur l&apos;espace de suivi du Projet Ouvert IMT CI1 (2026-2027).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* L'avatar, le badge de rôle et la déconnexion sont désormais gérés globalement dans le Header */}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avancement Global</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {doneTasks} / {totalTasks} tâches terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tâches en retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lateTasks > 0 ? "text-red-500" : "text-green-500"}`}>
              {lateTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {lateTasks === 0 ? "Tout est dans les temps" : "À traiter en priorité"}
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
        <MilestoneProgress achieved={achievedMilestones} remaining={remainingMilestones} />
        <WorkloadChart data={workloadByMember} />
      </div>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
        <BudgetGauge total={totalBudget} used={usedBudget} />
      </div>
    </div>
  );
}
