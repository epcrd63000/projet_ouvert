import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ThemeSettings } from "@/components/theme/ThemeSettings";
import { UserManagement } from "@/components/settings/UserManagement";
import { AlertBannerManager } from "@/components/settings/AlertBannerManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { role: "asc" },
  });

  const activeAlerts = await prisma.alertBanner.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres Administrateur</h1>
        <p className="text-muted-foreground">
          Gérez l&apos;équipe et les paramètres du projet.
        </p>
      </div>

      <ThemeSettings />

      <AlertBannerManager initialAlerts={activeAlerts} />

      <UserManagement initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
