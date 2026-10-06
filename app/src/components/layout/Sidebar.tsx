"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getVisibleNavItems, isRouteActive } from "./navConfig";

interface SidebarProps {
  userRole: "ADMIN" | "MEMBER";
}

/**
 * Barre de navigation latérale fixe sur desktop avec mise en surbrillance de la route active.
 */
export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = getVisibleNavItems(userRole);

  return (
    <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border bg-background md:block">
      <nav className="flex flex-col gap-1 p-3 text-sm font-medium">
        {visibleItems.map((item) => {
          const isActive = isRouteActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                isActive
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
