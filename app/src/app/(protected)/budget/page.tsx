import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import BudgetClient from "./BudgetClient";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst();
  const totalBudget = Number(project?.totalBudget) || 0;

  const [entries, fundingSources] = await Promise.all([
    prisma.budgetEntry.findMany({
      orderBy: { date: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
        fundingSource: { select: { id: true, name: true } },
      },
    }),
    prisma.fundingSource.findMany({
      where: project ? { projectId: project.id } : undefined,
      orderBy: { date: "asc" },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  const serializedEntries = entries.map((entry) => ({
    ...entry,
    amount: Number(entry.amount),
    unitPrice: entry.unitPrice !== null ? Number(entry.unitPrice) : null,
    deliveryCost: entry.deliveryCost !== null ? Number(entry.deliveryCost) : null,
    date: entry.date.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  const serializedFundingSources = fundingSources.map((source) => ({
    ...source,
    amount: Number(source.amount),
    date: source.date.toISOString(),
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Suivi Budgétaire & Trésorerie</h1>
        <p className="text-muted-foreground">
          Pilotez les dotations financières (APICIL, BDE, Fablab), les dépenses et la balance du voilier MINIMOCA.
        </p>
      </div>

      <BudgetClient
        initialEntries={serializedEntries}
        initialFundingSources={serializedFundingSources}
        totalBudget={totalBudget}
        isAdmin={session.user.role === "ADMIN"}
      />
    </div>
  );
}
