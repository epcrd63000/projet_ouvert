/**
 * Définition des types et interfaces pour la gestion des liens utiles du projet.
 */

export interface ProjectLinkItem {
  id: string;
  projectId?: string | null;
  createdById?: string | null;
  title: string;
  url: string;
  category: string;
  description?: string | null;
  imageUrl?: string | null;
  order: number;
  isPinned: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface LinkFormData {
  title: string;
  url: string;
  category: string;
  description?: string;
  imageUrl?: string;
  isPinned?: boolean;
}

export const DEFAULT_LINK_CATEGORIES = [
  "Général",
  "Drive & Documents",
  "Code & Dépôts",
  "Outils & Logiciels",
  "Documentation & Datasheets",
  "Communication",
] as const;
