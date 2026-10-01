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

  const entries = await prisma.budgetEntry.findMany({
    orderBy: { date: "desc" },
    include: { createdBy: { select: { name: true, email: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Suivi Budgétaire</h1>
        <p className="text-muted-foreground">
          Gérez et suivez les dépenses du projet.
        </p>
      </div>

      <BudgetClient 
        initialEntries={entries} 
        totalBudget={totalBudget} 
        isAdmin={session.user.role === "ADMIN"} 
      />
    </div>
  );
}
