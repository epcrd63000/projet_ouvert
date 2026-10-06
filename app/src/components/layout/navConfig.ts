import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  CalendarDays,
  BarChart3,
  Banknote,
  Bell,
  Settings,
  BookOpen,
} from "lucide-react";

/**
 * Interface représentant un lien de navigation du menu principal ou mobile.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

/**
 * Liste complète des pages accessibles dans l'application.
 */
export const NAV_ITEMS: NavItem[] = [
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

/**
 * Raccourcis clés affichés dans la barre de navigation inférieure mobile.
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/kanban", label: "Tâches", icon: CheckSquare },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/meetings", label: "Réunions", icon: Users },
];

/**
 * Filtre les liens selon le rôle de l'utilisateur (ADMIN ou MEMBER).
 */
export function getVisibleNavItems(userRole: "ADMIN" | "MEMBER"): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || userRole === "ADMIN");
}

/**
 * Détermine si une route courante correspond à un lien de navigation.
 */
export function isRouteActive(currentPathname: string, itemHref: string): boolean {
  if (currentPathname === itemHref) {
    return true;
  }
  // Pour les pages enfants (ex: /meetings/uuid), vérifier le préfixe si ce n'est pas la racine
  if (itemHref !== "/" && itemHref !== "/dashboard" && currentPathname.startsWith(itemHref + "/")) {
    return true;
  }
  return false;
}
