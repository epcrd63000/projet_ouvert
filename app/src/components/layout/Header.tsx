"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { Sun, Moon, Menu } from "lucide-react";

interface HeaderProps {
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "MEMBER";
  onOpenMobileNav?: () => void;
}

/**
 * En-tête principal de l'application avec logo, menu mobile, notifications, thème et profil.
 */
export function Header({
  userName,
  userEmail,
  userRole, // eslint-disable-line @typescript-eslint/no-unused-vars
  onOpenMobileNav,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-4">
        {/* Menu burger mobile & Logo */}
        <div className="flex items-center gap-2">
          {onOpenMobileNav && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden text-foreground hover:bg-muted"
              onClick={onOpenMobileNav}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground font-bold shadow-xs">
              IMT CI1
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Projet Ouvert
            </span>
          </Link>
        </div>

        {/* Actions : notifications, thème, profil, déconnexion */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloche de notifications */}
          <NotificationBell />

          {/* Bascule clair / sombre */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label="Changer le thème"
          >
            <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Profil utilisateur (visible sur écrans moyens et grands) */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {/* Déconnexion (sur mobile accessible directement dans le tiroir de navigation) */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
