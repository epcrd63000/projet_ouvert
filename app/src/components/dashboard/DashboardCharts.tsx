"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
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

export function MemberProgressChart({ data }: { data: { name: string; done: number; total: number }[] }) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Avancement par membre</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="done" name="Tâches terminées" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkloadChart({ data }: { data: { name: string; inProgress: number }[] }) {
  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Workload (En cours)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" fontSize={12} />
              <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 1']} tick={false} />
              <Radar name="Tâches" dataKey="inProgress" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
              <RechartsTooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function BudgetGauge({ used, total }: { used: number; total: number }) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Budget</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <span className="text-3xl font-bold">{used.toFixed(2)} €</span>
          <span className="text-muted-foreground text-sm">/ {total.toFixed(2)} €</span>
        </div>
        <Progress value={percentage} className="h-4" />
        <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% consommé</p>
      </CardContent>
    </Card>
  );
}

export function MilestoneProgress({ achieved, remaining }: { achieved: number; remaining: number }) {
  const data = [
    { name: "Atteints", value: achieved, color: "#10b981" },
    { name: "Restants", value: remaining, color: "#e2e8f0" },
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
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-sm mt-2">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#10b981] rounded-full"></div>{achieved} atteints</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#e2e8f0] rounded-full"></div>{remaining} restants</div>
        </div>
      </CardContent>
    </Card>
  );
}
