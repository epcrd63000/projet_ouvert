import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChartIcon, AlertTriangle, Hourglass } from "lucide-react";
import {
  MemberProgressChart,
  WorkloadChart,
  BudgetGauge,
  MilestoneProgress,
} from "@/components/dashboard/DashboardCharts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface GeneralDashboardViewProps {
  globalMetrics: {
    completionRate: number;
    doneTasks: number;
    totalTasks: number;
    lateTasks: number;
    totalBudget: number;
    usedBudget: number;
    remainingBudget: number;
    achievedMilestones: number;
    remainingMilestones: number;
  };
  progressByMember: any[];
  workloadByMember: any[];
  nextMeeting: {
    scheduledAt: Date;
    title: string;
  } | null;
}

/**
 * Vue générale du tableau de bord affichant les indicateurs d'avancement, le budget et la charge.
 */
export function GeneralDashboardView({
  globalMetrics,
  progressByMember,
  workloadByMember,
  nextMeeting,
}: GeneralDashboardViewProps) {
  return (
    <div className="space-y-6">
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
            <div
              className={`text-2xl font-bold ${
                globalMetrics.lateTasks > 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              {globalMetrics.lateTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {globalMetrics.lateTasks === 0
                ? "Tout est dans les temps"
                : "À traiter en priorité"}
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
                  {formatDistanceToNow(new Date(nextMeeting.scheduledAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">{nextMeeting.title}</p>
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
