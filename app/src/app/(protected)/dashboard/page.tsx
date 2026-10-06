import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";
import prisma from "@/lib/prisma";
import { GeneralDashboardView } from "@/components/dashboard/GeneralDashboardView";
import { AdminActivityTab } from "@/components/dashboard/admin-activity/AdminActivityTab";
import { ActivityHeartbeat } from "@/components/dashboard/ActivityHeartbeat";
import {
  calculateGlobalMetrics,
  calculateMemberProgress,
  calculateWorkload,
  calculatePersonalSummary,
} from "@/lib/dashboard/dashboardMetrics";
import {
  getWeekDateRange,
  calculateMemberWeeklyActivity,
  calculateActivitySummary,
} from "@/lib/dashboard/adminActivityMetrics";
import { calculateEffectiveTotalBudget } from "@/lib/budget/budgetCalculations";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const isAdmin = user.role === "ADMIN";

  // Plage de dates de la semaine courante pour l'activité admin
  const currentWeekRange = getWeekDateRange(new Date(), 0);

  // Requêtes concurrentes pour alimenter les métriques du dashboard
  const [
    allTasks,
    allUsers,
    milestones,
    budgetEntries,
    fundingSources,
    project,
    nextMeeting,
    adminActivityLogs,
  ] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, avatarUrl: true },
      orderBy: { name: "asc" },
    }),
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
    isAdmin
      ? prisma.userActivityLog.findMany({
          where: {
            createdAt: {
              gte: currentWeekRange.startOfWeek,
              lte: currentWeekRange.endOfWeek,
            },
          },
          select: { id: true, userId: true, actionType: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  // Calcul du budget effectif basé sur les dotations avec repli projet
  const fallbackBudget = Number(project?.totalBudget) || 0;
  const effectiveTotalBudget = calculateEffectiveTotalBudget(
    fundingSources as any,
    fallbackBudget
  );

  const consumedEntries = budgetEntries.filter(
    (e) => e.status === "PAID" || e.status === "VALIDATED"
  );

  const globalMetrics = calculateGlobalMetrics(
    allTasks as any,
    milestones as any,
    consumedEntries as any,
    effectiveTotalBudget
  );

  const progressByMember = calculateMemberProgress(allUsers, allTasks as any);
  const workloadByMember = calculateWorkload(allUsers, allTasks as any);
  const personalSummary = calculatePersonalSummary(user.id, allTasks as any);

  // Pré-calcul serveur de l'activité hebdomadaire pour les administrateurs
  let initialAdminActivity = null;
  if (isAdmin) {
    const adaptedTasks = allTasks.map((t) => ({
      id: t.id,
      createdById: t.createdById,
      lastUpdate: t.lastUpdate || t.updatedAt,
      assignments: t.assignments.map((a) => a.userId),
    }));

    const allMeetings = await prisma.meeting.findMany({
      where: {
        createdAt: {
          gte: currentWeekRange.startOfWeek,
          lte: currentWeekRange.endOfWeek,
        },
      },
      select: {
        id: true,
        createdById: true,
        createdAt: true,
        attendees: { select: { userId: true } },
      },
    });

    const adaptedMeetings = allMeetings.map((m) => ({
      id: m.id,
      createdById: m.createdById,
      createdAt: m.createdAt,
      attendees: m.attendees.map((a) => a.userId),
    }));

    const membersActivity = calculateMemberWeeklyActivity(
      allUsers,
      adminActivityLogs,
      adaptedTasks,
      adaptedMeetings,
      currentWeekRange
    );

    const summary = calculateActivitySummary(membersActivity);

    initialAdminActivity = {
      weekRange: currentWeekRange,
      members: membersActivity,
      summary,
    };
  }

  return (
    <div className="space-y-6">
      {/* Enregistre la visite active quotidienne sans bloquer le rendu */}
      <ActivityHeartbeat />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour {user.name} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suivi opérationnel du Projet Ouvert IMT CI1 (2026-2027) — Voilier MINIMOCA.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-xs font-semibold text-muted-foreground mr-0.5">
              Mes tâches assignées :
            </span>
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

      {isAdmin ? (
        <Tabs defaultValue="general" className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="general">Vue Générale</TabsTrigger>
              <TabsTrigger value="admin-activity" className="gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Activité Équipe (Admin)
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-6 mt-0">
            <GeneralDashboardView
              globalMetrics={globalMetrics}
              progressByMember={progressByMember}
              workloadByMember={workloadByMember}
              nextMeeting={nextMeeting}
            />
          </TabsContent>

          <TabsContent value="admin-activity" className="space-y-6 mt-0">
            <AdminActivityTab initialData={initialAdminActivity} />
          </TabsContent>
        </Tabs>
      ) : (
        <GeneralDashboardView
          globalMetrics={globalMetrics}
          progressByMember={progressByMember}
          workloadByMember={workloadByMember}
          nextMeeting={nextMeeting}
        />
      )}
    </div>
  );
}
