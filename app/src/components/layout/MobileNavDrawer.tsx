"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, LogOut, ChevronRight } from "lucide-react";
import { getVisibleNavItems, isRouteActive } from "./navConfig";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "MEMBER";
}

/**
 * Volet de navigation coulissant pour appareils mobiles et petits écrans.
 */
export function MobileNavDrawer({
  isOpen,
  onClose,
  userName,
  userEmail,
  userRole,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const visibleItems = getVisibleNavItems(userRole);

  // Verrouillage du scroll en arrière-plan lorsque le tiroir est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fermeture automatique lors d'une touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay translucide */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Volet latéral coulissant */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-4/5 max-w-xs flex-col border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200">
        {/* En-tête du volet */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground font-bold">
              IMT CI1
            </span>
            <span className="text-sm font-semibold tracking-tight">Projet Ouvert</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Liste des liens de navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = isRouteActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 opacity-50", isActive && "opacity-100")} />
              </Link>
            );
          })}
        </nav>

        {/* Pied du volet avec profil et déconnexion */}
        <div className="border-t border-border p-4 bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <Badge variant={userRole === "ADMIN" ? "default" : "secondary"} className="text-[10px] uppercase">
              {userRole}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              onClose();
              signOut({ callbackUrl: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}
