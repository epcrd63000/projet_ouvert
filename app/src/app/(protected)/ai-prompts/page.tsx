import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AiPromptClient } from "./AiPromptClient";

export const dynamic = "force-dynamic";

export default async function AiPromptsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/dashboard");
  }

  const initialPrompts = await prisma.aiPrompt.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Bibliothèque de Prompts IA</h1>
        <p className="text-muted-foreground">
          Gérez et consultez les modèles de prompts pour assister vos tâches.
        </p>
      </div>

      <AiPromptClient initialPrompts={initialPrompts} userRole={session.user.role as "ADMIN" | "MEMBER"} />
    </div>
  );
}
