"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { BottomNavBar } from "@/components/layout/BottomNavBar";

interface ProtectedShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "MEMBER";
}

/**
 * Shell applicatif client complet :
 * - Desktop : Header + Sidebar latérale fixe.
 * - Mobile : Header avec bouton burger + Tiroir latéral + Barre de navigation inférieure persistante.
 */
export function ProtectedShell({
  children,
  userName,
  userEmail,
  userRole,
}: ProtectedShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* En-tête avec bouton burger sur mobile */}
      <Header
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
      />

      <div className="flex flex-1">
        {/* Navigation latérale desktop */}
        <Sidebar userRole={userRole} />

        {/* Zone de contenu principale responsive (marge inférieure pour la barre mobile) */}
        <main className="flex-1 overflow-auto p-3.5 sm:p-5 md:p-6 pb-20 md:pb-6 md:ml-56">
          {children}
        </main>
      </div>

      {/* Volet de navigation coulissant pour mobile */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
      />

      {/* Barre de navigation inférieure pour accès direct sur smartphone */}
      <BottomNavBar
        onOpenMenu={() => setIsMobileNavOpen((prev) => !prev)}
        isMenuOpen={isMobileNavOpen}
      />
    </div>
  );
}
