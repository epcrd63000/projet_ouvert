"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  CalendarDays, 
  BarChart3, 
  Banknote, 
  Bell, 
  Settings,
  BookOpen
} from "lucide-react";

/**
 * Élément de navigation dans la sidebar.
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

/**
 * Liste des liens de navigation de la sidebar.
 * Les items marqués adminOnly ne s'affichent que pour les ADMIN.
 */
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/infos", label: "Infos Importantes", icon: BookOpen },
  { href: "/kanban", label: "Mes Tâches", icon: CheckSquare },
  { href: "/meetings", label: "Réunions", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/gantt", label: "Gantt", icon: BarChart3 },
  { href: "/budget", label: "Budget", icon: Banknote },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/ai-prompts", label: "Prompts IA", icon: BookOpen },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

interface SidebarProps {
  userRole: "ADMIN" | "MEMBER";
}

/**
 * Barre de navigation latérale fixe avec mise en surbrillance de la route active.
 */
export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "ADMIN"
  );

  return (
    <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border bg-background md:block">
      <nav className="flex flex-col gap-1 p-3 text-sm font-medium">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
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
