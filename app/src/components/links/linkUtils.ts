/**
 * Fonctions utilitaires pour le traitement, le formatage et le filtrage des liens utiles.
 */

import { ProjectLinkItem } from "./linkTypes";

/**
 * Normalise une chaîne d'URL en s'assurant qu'elle possède un protocole valide (https:// par défaut).
 */
export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Génère l'URL de favicon haute résolution via le service Google Favicon V2.
 */
export function fetchGoogleFavicon(url: string, size: number = 128): string {
  const normalized = normalizeUrl(url);
  if (!normalized) return "";
  try {
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
      normalized
    )}&size=${size}`;
  } catch {
    return "";
  }
}

/**
 * Regroupe un ensemble de liens par leur catégorie.
 */
export function groupLinksByCategory(
  links: ProjectLinkItem[]
): Record<string, ProjectLinkItem[]> {
  const groups: Record<string, ProjectLinkItem[]> = {};

  for (const link of links) {
    const cat = link.category || "Général";
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(link);
  }

  return groups;
}

/**
 * Filtre et ordonne la liste des liens selon une catégorie sélectionnée et une requête de recherche textuelle.
 */
export function filterLinks(
  links: ProjectLinkItem[],
  query: string,
  category: string
): ProjectLinkItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = links.filter((link) => {
    const matchesCategory =
      category === "ALL" || !category || link.category === category;
    if (!matchesCategory) return false;

    if (!normalizedQuery) return true;

    const inTitle = link.title.toLowerCase().includes(normalizedQuery);
    const inUrl = link.url.toLowerCase().includes(normalizedQuery);
    const inDesc = link.description
      ? link.description.toLowerCase().includes(normalizedQuery)
      : false;

    return inTitle || inUrl || inDesc;
  });

  // Tri : éléments épinglés en priorité, puis par ordre ou date décroissante
  return filtered.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}
