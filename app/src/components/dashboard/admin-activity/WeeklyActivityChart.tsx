"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MemberActivityData } from "@/lib/dashboard/adminActivityMetrics";

interface WeeklyActivityChartProps {
  data: MemberActivityData[];
}

/**
 * Graphique en barres ordonné du membre le plus connecté (gauche) au moins connecté (droite).
 * Distingue les visites actives d'application des actions concrètes (tâches, réunions).
 */
export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const chartData = data.map((member) => ({
    name: member.name,
    email: member.email,
    visits: member.visitsCount,
    actions: member.actionsCount,
    total: member.totalActivity,
    lastActiveDate: member.lastActiveDate
      ? new Date(member.lastActiveDate).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Aucune",
  }));

  const maxTotal = Math.max(5, ...data.map((d) => d.totalActivity));

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Activité Hebdomadaire par Membre
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Classement ordonné : du plus actif à gauche au moins actif à droite.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" /> Visites actives
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Actions concrètes
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            Aucun membre enregistré dans le projet.
          </div>
        ) : (
          <div className="h-[320px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -15, bottom: 25 }}
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--foreground))" }}
                  tickFormatter={(val: string) => {
                    const parts = val.split(" ");
                    return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : val;
                  }}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--foreground))" }}
                  allowDecimals={false}
                  domain={[0, maxTotal + 1]}
                />
                <RechartsTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-md text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-semibold text-sm border-b border-border/60 pb-1">
                            {item.name}
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Email :</span>
                            <span className="font-medium text-foreground">{item.email}</span>
                          </div>
                          <div className="flex justify-between items-center text-blue-500 font-medium">
                            <span>Visites actives :</span>
                            <span className="text-sm font-bold">{item.visits}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-500 font-medium">
                            <span>Actions concrètes :</span>
                            <span className="text-sm font-bold">{item.actions}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-border/40 font-semibold text-foreground">
                            <span>Total interactions :</span>
                            <span className="text-sm font-bold">{item.total}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground pt-0.5">
                            Dernière activité : {item.lastActiveDate}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "12px" }}
                />
                <Bar
                  dataKey="visits"
                  name="Visites actives"
                  fill="#3b82f6"
                  stackId="activity"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="actions"
                  name="Actions concrètes"
                  fill="#10b981"
                  stackId="activity"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
