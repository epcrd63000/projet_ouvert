"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "./NotificationBell";
import { Sun, Moon } from "lucide-react";

interface HeaderProps {
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "MEMBER";
}

/**
 * En-tête principal de l'application avec logo, notifications, thème et profil.
 */
export function Header({ userName, userEmail, userRole }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo et titre */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            IMT CI1
          </span>
          <span className="hidden sm:inline">Projet Ouvert</span>
        </Link>

        {/* Actions : notifications, thème, profil */}
        <div className="flex items-center gap-3">
          {/* Cloche de notifications */}
          <NotificationBell />


          {/* Toggle dark/light */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer le thème</span>
          </Button>

          {/* Profil utilisateur */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            {/* Rôle masqué conformément à la demande: <Badge variant={userRole === "ADMIN" ? "default" : "secondary"}>{userRole}</Badge> */}
          </div>

          {/* Déconnexion */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
