import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ThemeSettings } from "@/components/theme/ThemeSettings";
import { UserManagement } from "@/components/settings/UserManagement";
import { AlertBannerManager } from "@/components/settings/AlertBannerManager";
import { UserSettings } from "@/components/settings/UserSettings";
import { EtienneCredentialsPanel } from "@/components/settings/EtienneCredentialsPanel";
import { isTempPasswordActive } from "@/lib/auth/tempPasswordCheck";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/dashboard");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Restriction stricte de l'espace des identifiants et mots de passe au compte d'Étienne
  const isEtienne =
    isAdmin &&
    (session.user.email?.toLowerCase().includes("etienne") ||
      session.user.name?.toLowerCase().includes("etienne"));

  let users: any[] = [];
  let credentialUsers: any[] = [];

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

  if (isEtienne) {
    const rawCredentialUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tempPassword: true,
        tempPasswordExpiresAt: true,
        passwordHash: true,
      },
      orderBy: { name: "asc" },
    });

    // Chaque mot de passe affiché est confronté au hash actif : un mot de passe
    // désynchronisé ne doit jamais être copié ni envoyé par mail.
    credentialUsers = await Promise.all(
      rawCredentialUsers.map(async (u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        tempPassword: u.tempPassword,
        tempPasswordExpiresAt: u.tempPasswordExpiresAt
          ? u.tempPasswordExpiresAt.toISOString()
          : null,
        tempPasswordIsValid: u.tempPassword
          ? await isTempPasswordActive(u.tempPassword, u.passwordHash)
          : null,
      }))
    );
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos préférences personnelles et les paramètres du projet.
        </p>
      </div>

      {/* Espace sécurisé réservé exclusivement à Étienne pour la distribution des accès */}
      {isEtienne && <EtienneCredentialsPanel initialUsers={credentialUsers} />}

      <ThemeSettings />

      <UserSettings />

      <AlertBannerManager />

      {isAdmin && <UserManagement initialUsers={users} currentUserId={session.user.id} />}
    </div>
  );
}
