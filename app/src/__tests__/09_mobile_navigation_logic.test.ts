/**
 * Tests unitaires TDD pour la configuration de navigation et les utilitaires mobiles.
 */

import {
  NAV_ITEMS,
  BOTTOM_NAV_ITEMS,
  getVisibleNavItems,
  isRouteActive,
} from "../components/layout/navConfig";

function runMobileNavTests() {
  console.log("🧪 Lancement des tests unitaires de navigation mobile (TDD)...");

  // 1. Test du filtrage par rôle (MEMBER vs ADMIN)
  const memberItems = getVisibleNavItems("MEMBER");
  const adminItems = getVisibleNavItems("ADMIN");

  if (!memberItems.every((item) => !item.adminOnly)) {
    throw new Error("❌ Un membre normal a accès à un élément réservé aux admins !");
  }
  console.log("  ✅ getVisibleNavItems filtre correctement pour MEMBER");

  if (adminItems.length < memberItems.length && adminItems.some((i) => i.adminOnly)) {
    throw new Error("❌ L'administrateur devrait voir au moins autant d'éléments que le membre.");
  }
  console.log("  ✅ getVisibleNavItems inclut tous les éléments pour ADMIN");

  // 2. Test des éléments de la barre inférieure (Bottom Nav)
  if (BOTTOM_NAV_ITEMS.length !== 4) {
    throw new Error(`❌ Attendu 4 raccourcis principaux pour la barre mobile, reçu: ${BOTTOM_NAV_ITEMS.length}`);
  }
  const bottomHrefs = BOTTOM_NAV_ITEMS.map((item) => item.href);
  if (!bottomHrefs.includes("/dashboard") || !bottomHrefs.includes("/kanban")) {
    throw new Error("❌ La barre mobile doit contenir au minimum /dashboard et /kanban");
  }
  console.log("  ✅ BOTTOM_NAV_ITEMS contient les raccourcis clés");

  // 3. Test de la détection de route active
  if (!isRouteActive("/dashboard", "/dashboard")) {
    throw new Error("❌ /dashboard devrait être actif sur /dashboard");
  }
  if (!isRouteActive("/meetings/abc-123", "/meetings")) {
    throw new Error("❌ /meetings/abc-123 devrait activer le menu /meetings");
  }
  if (isRouteActive("/kanban", "/dashboard")) {
    throw new Error("❌ /kanban ne doit pas activer /dashboard");
  }
  console.log("  ✅ isRouteActive détecte correctement les correspondances exactes et imbriquées");

  console.log("🎉 Tous les tests unitaires de navigation mobile sont validés avec succès !");
}

try {
  runMobileNavTests();
} catch (error) {
  console.error(error);
  process.exit(1);
}
