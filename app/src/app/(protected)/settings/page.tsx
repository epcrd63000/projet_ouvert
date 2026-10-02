import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ThemeSettings } from "@/components/theme/ThemeSettings";
import { UserManagement } from "@/components/settings/UserManagement";
import { AlertBannerManager } from "@/components/settings/AlertBannerManager";
import { UserSettings } from "@/components/settings/UserSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/dashboard");
  }
  
  const isAdmin = session.user.role === "ADMIN";

  let users: any[] = [];
  if (isAdmin) {
    users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { role: "asc" },
    });
  }

  const activeAlerts = await prisma.alertBanner.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos préférences et les paramètres du projet.
        </p>
      </div>

      <ThemeSettings />
      
      <UserSettings />

      <AlertBannerManager initialAlerts={activeAlerts} />

      {isAdmin && <UserManagement initialUsers={users} currentUserId={session.user.id} />}
    </div>
  );
}
