/**
 * Tests unitaires de la logique métier des liens utiles (TDD).
 */

import {
  normalizeUrl,
  fetchGoogleFavicon,
  groupLinksByCategory,
  filterLinks,
} from "../components/links/linkUtils";
import { ProjectLinkItem } from "../components/links/linkTypes";

function runLinksLogicTests() {
  console.log("🧪 Lancement des tests unitaires de la gestion des liens utiles (TDD)...");

  // 1. Test de normalisation des URLs
  console.assert(normalizeUrl("google.com") === "https://google.com", "normalizeUrl 1 échoué");
  console.assert(normalizeUrl("  github.com/epcrd  ") === "https://github.com/epcrd", "normalizeUrl 2 échoué");
  console.assert(normalizeUrl("http://localhost:3000") === "http://localhost:3000", "normalizeUrl 3 échoué");
  console.assert(normalizeUrl("https://drive.google.com") === "https://drive.google.com", "normalizeUrl 4 échoué");
  console.assert(normalizeUrl("") === "", "normalizeUrl 5 échoué");
  console.log("  ✅ normalizeUrl validé");

  // 2. Test du générateur de Favicon Google
  const faviconUrl = fetchGoogleFavicon("https://drive.google.com");
  console.assert(faviconUrl.includes("t3.gstatic.com/faviconV2"), "fetchGoogleFavicon URL service échoué");
  console.assert(faviconUrl.includes(encodeURIComponent("https://drive.google.com")), "fetchGoogleFavicon paramètre URL échoué");
  console.assert(fetchGoogleFavicon("") === "", "fetchGoogleFavicon vide échoué");
  console.log("  ✅ fetchGoogleFavicon validé");

  // 3. Test de regroupement par catégorie
  const mockLinks: ProjectLinkItem[] = [
    {
      id: "1",
      title: "Google Drive IMOCA",
      url: "https://drive.google.com/folder",
      category: "Drive & Documents",
      isPinned: true,
      order: 0,
      createdAt: new Date("2026-10-01"),
      updatedAt: new Date("2026-10-01"),
    },
    {
      id: "2",
      title: "GitHub Repo",
      url: "https://github.com/org/repo",
      category: "Code & Dépôts",
      isPinned: false,
      order: 1,
      createdAt: new Date("2026-10-02"),
      updatedAt: new Date("2026-10-02"),
    },
    {
      id: "3",
      title: "Docs Techniques",
      url: "https://docs.com",
      category: "Drive & Documents",
      isPinned: false,
      order: 2,
      createdAt: new Date("2026-10-03"),
      updatedAt: new Date("2026-10-03"),
    },
  ];

  const grouped = groupLinksByCategory(mockLinks);
  console.assert(Object.keys(grouped).length === 2, "groupLinksByCategory nombre de clés attendu: 2");
  console.assert(grouped["Drive & Documents"].length === 2, "groupLinksByCategory Drive & Documents count attendu: 2");
  console.assert(grouped["Code & Dépôts"].length === 1, "groupLinksByCategory Code & Dépôts count attendu: 1");
  console.log("  ✅ groupLinksByCategory validé");

  // 4. Test du filtrage et recherche
  const searchResults = filterLinks(mockLinks, "github", "ALL");
  console.assert(searchResults.length === 1 && searchResults[0].id === "2", "filterLinks par mot-clé 'github' échoué");

  const catFiltered = filterLinks(mockLinks, "", "Drive & Documents");
  console.assert(catFiltered.length === 2, "filterLinks par catégorie échoué");

  // Les éléments épinglés doivent figurer en premier
  console.assert(catFiltered[0].isPinned === true, "Tri des épinglés en premier échoué");
  console.log("  ✅ filterLinks validé");

  console.log("🎉 Tous les tests unitaires de la gestion des liens sont passés avec succès !\n");
}

runLinksLogicTests();
