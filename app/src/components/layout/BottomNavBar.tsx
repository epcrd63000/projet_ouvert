"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { BOTTOM_NAV_ITEMS, isRouteActive } from "./navConfig";

interface BottomNavBarProps {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

/**
 * Barre de navigation mobile inférieure persistante (Bottom Navigation Bar).
 * Donne un accès tactile immédiat aux 4 vues prioritaires et au menu complet.
 */
export function BottomNavBar({ onOpenMenu, isMenuOpen }: BottomNavBarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation mobile rapide"
      className="fixed bottom-0 inset-x-0 z-40 flex h-14 items-center justify-around border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-safe"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = isRouteActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5 mb-0.5", isActive && "stroke-[2.5px]")} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      {/* Bouton pour ouvrir le tiroir avec toutes les rubriques */}
      <button
        type="button"
        onClick={onOpenMenu}
        className={cn(
          "flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors",
          isMenuOpen ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Ouvrir le menu complet"
      >
        <Menu className={cn("h-5 w-5 mb-0.5", isMenuOpen && "stroke-[2.5px]")} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
