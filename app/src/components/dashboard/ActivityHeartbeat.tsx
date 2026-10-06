"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Composant discret enregistrant la visite quotidienne de l'utilisateur connecté
 * et garantissant la fraîcheur instantanée des indicateurs du Dashboard au focus.
 */
export function ActivityHeartbeat() {
  const router = useRouter();

  useEffect(() => {
    // 1. Enregistrement de la visite quotidienne
    const todayKey = `imt_hb_${new Date().toISOString().slice(0, 10)}`;
    const alreadySentToday = sessionStorage.getItem(todayKey);

    if (!alreadySentToday) {
      fetch("/api/activity/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (res.ok) {
            sessionStorage.setItem(todayKey, "true");
          }
        })
        .catch((err) => {
          console.warn("[ActivityHeartbeat] Impossible d'enregistrer la visite:", err);
        });
    }

    // 2. Rafraîchissement automatique des métriques dès que l'onglet redevient actif
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
