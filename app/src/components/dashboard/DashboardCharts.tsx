"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function MemberProgressChart({
  data,
}: {
  data: { name: string; done: number; total: number; completionRate?: number }[];
}) {
  const maxTotal = Math.max(1, ...data.map((d) => Math.max(d.done, d.total)));

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Avancement par membre</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--foreground))" }}
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
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                formatter={(value: any, name: string, item: any) => {
                  const payload = item?.payload;
                  const rate =
                    payload?.total > 0
                      ? Math.round((payload.done / payload.total) * 100)
                      : 0;
                  if (name === "Tâches terminées") {
                    return [`${value} (${rate}% complété)`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingBottom: "8px" }}
              />
              <Bar
                dataKey="done"
                name="Tâches terminées"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="total"
                name="Total assigné"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkloadChart({ data }: { data: { name: string; inProgress: number }[] }) {
  const maxInProgress = Math.max(1, ...data.map(d => d.inProgress));

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Workload (En cours)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="55%" data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" fontSize={12} tick={{ fill: "hsl(var(--foreground))" }} />
              <PolarRadiusAxis angle={30} domain={[0, maxInProgress]} tick={false} axisLine={false} />
              <Radar name="Tâches" dataKey="inProgress" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: "8px" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function BudgetGauge({
  used,
  total,
  remaining,
}: {
  used: number;
  total: number;
  remaining?: number;
}) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const isOverbudget = percentage > 100;
  const remainingValue = remaining !== undefined ? remaining : Math.round((total - used) * 100) / 100;

  return (
    <Card className="col-span-1 lg:col-span-2 flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Budget & Trésorerie</CardTitle>
        <Link
          href="/budget"
          className="text-xs text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
        >
          Voir détails →
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <span className={`text-3xl font-bold ${isOverbudget ? "text-red-500" : ""}`}>
            {used.toFixed(2)} €
          </span>
          <span className="text-muted-foreground text-sm font-medium">/ {total.toFixed(2)} €</span>
        </div>
        <Progress
          value={Math.min(percentage, 100)}
          className={`h-3.5 ${isOverbudget ? "[&>div]:bg-red-500" : ""}`}
        />
        <div className="flex justify-between items-center text-xs">
          <span className={isOverbudget ? "text-red-500 font-medium" : "text-muted-foreground"}>
            {percentage.toFixed(1)}% consommé {isOverbudget && "(Dépassement)"}
          </span>
          <span
            className={`font-semibold ${
              remainingValue >= 0 ? "text-emerald-600" : "text-destructive"
            }`}
          >
            {remainingValue >= 0
              ? `Solde restant : ${remainingValue.toFixed(2)} €`
              : `Déficit : ${Math.abs(remainingValue).toFixed(2)} €`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function MilestoneProgress({ achieved, remaining }: { achieved: number; remaining: number }) {
  const data = [
    { name: "Atteints", value: achieved, color: "#10b981" },
    { name: "Restants", value: remaining, color: "hsl(var(--muted))" },
  ];
  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Jalons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: "8px" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-sm mt-2">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#10b981] rounded-full"></div>{achieved} atteints</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-muted rounded-full border border-border"></div>{remaining} restants</div>
        </div>
      </CardContent>
    </Card>
  );
}
