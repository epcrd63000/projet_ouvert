import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { InfoClient } from "./InfoClient";

export const dynamic = "force-dynamic";

export default async function InfosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/dashboard");
  }

  const isAdmin = session.user.role === "ADMIN";

  const infos = await prisma.importantInfo.findMany({
    orderBy: [
      { isPinned: "desc" },
      { order: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Infos Importantes & Documentation</h1>
        <p className="text-muted-foreground text-sm">
          Documentation centralisée du voilier MINIMOCA : gouvernance, calendrier des jalons, dossier technique et imports Markdown (.md).
        </p>
      </div>

      <InfoClient initialInfos={infos as any} isAdmin={isAdmin} />
    </div>
  );
}
