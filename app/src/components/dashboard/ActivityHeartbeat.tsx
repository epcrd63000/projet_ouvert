"use client";

import { useEffect } from "react";

/**
 * Composant discret enregistrant la visite quotidienne de l'utilisateur connecté.
 * Utilise un indicateur en sessionStorage pour limiter les appels réseau inutiles.
 */
export function ActivityHeartbeat() {
  useEffect(() => {
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
  }, []);

  return null;
}
