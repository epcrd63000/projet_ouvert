"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

interface ProtectedShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "MEMBER";
}

/**
 * Shell applicatif client : Header + Sidebar + zone de contenu principal.
 * Reçoit les données de session depuis le layout serveur.
 */
export function ProtectedShell({
  children,
  userName,
  userEmail,
  userRole,
}: ProtectedShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header userName={userName} userEmail={userEmail} userRole={userRole} />
      <div className="flex flex-1">
        <Sidebar userRole={userRole} />
        <main className="flex-1 overflow-auto p-6 md:ml-56">
          {children}
        </main>
      </div>
    </div>
  );
}
