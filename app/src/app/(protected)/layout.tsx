import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProtectedShell } from "@/components/layout/ProtectedShell";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout serveur pour les routes protégées.
 * Récupère la session et transmet les infos utilisateur au shell client.
 */
export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ProtectedShell
      userName={session.user.name || "Utilisateur"}
      userEmail={session.user.email || ""}
      userRole={(session.user.role as "ADMIN" | "MEMBER") || "MEMBER"}
    >
      {children}
    </ProtectedShell>
  );
}
