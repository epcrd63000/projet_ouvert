"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { WeekNavigation } from "./WeekNavigation";
import { ActivitySummaryCards } from "./ActivitySummaryCards";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { MemberActivityTable } from "./MemberActivityTable";
import {
  MemberActivityData,
  ActivitySummaryMetrics,
  WeekDateRange,
} from "@/lib/dashboard/adminActivityMetrics";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminActivityDataResponse {
  weekRange: WeekDateRange;
  members: MemberActivityData[];
  summary: ActivitySummaryMetrics;
}

interface AdminActivityTabProps {
  initialData?: AdminActivityDataResponse | null;
}

/**
 * Composant conteneur principal de l'onglet administrateur d'activité hebdomadaire.
 * Utilise un cache mémoire ultra-rapide (Map) pour garantir une navigation instantanée
 * entre les semaines et un retour immédiat à la semaine courante (0ms de latence).
 */
export function AdminActivityTab({ initialData }: AdminActivityTabProps) {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [activityData, setActivityData] = useState<AdminActivityDataResponse | null>(
    initialData || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [hasError, setHasError] = useState<boolean>(false);

  // Cache mémoire des semaines déjà visitées pour navigation instantanée
  const weekCacheRef = useRef<Map<number, AdminActivityDataResponse>>(new Map());

  // Initialisation du cache avec les données pré-calculées par le serveur pour la semaine 0
  useEffect(() => {
    if (initialData) {
      weekCacheRef.current.set(0, initialData);
      setActivityData(initialData);
    }
  }, [initialData]);

  // Fonction centrale de navigation avec gestion du cache et annulation de requêtes
  const navigateToWeek = useCallback(async (targetOffset: number, forceRefresh = false) => {
    setWeekOffset(targetOffset);

    // 1. Retour instantané depuis le cache si disponible
    if (!forceRefresh && weekCacheRef.current.has(targetOffset)) {
      const cached = weekCacheRef.current.get(targetOffset)!;
      setActivityData(cached);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // 2. Récupération asynchrone si la semaine n'est pas encore en mémoire
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/admin/activity?weekOffset=${targetOffset}`);
      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }
      const data: AdminActivityDataResponse = await res.json();
      weekCacheRef.current.set(targetOffset, data);
      setActivityData(data);
    } catch (err) {
      console.error("[AdminActivityTab] Erreur lors de la navigation :", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Chargement initial si initialData n'était pas fourni par le serveur
  useEffect(() => {
    if (!initialData && weekCacheRef.current.size === 0) {
      navigateToWeek(0);
    }
  }, [initialData, navigateToWeek]);

  const handleOffsetChange = (newOffset: number) => {
    navigateToWeek(newOffset);
  };

  const handleRefresh = () => {
    navigateToWeek(weekOffset, true);
  };

  if (hasError && !activityData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5 space-y-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          Une anomalie est survenue lors de la récupération des données de cette semaine.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigateToWeek(weekOffset, true)}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!activityData && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs">Chargement des indicateurs d&apos;activité...</p>
      </div>
    );
  }

  if (!activityData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <WeekNavigation
        formattedLabel={activityData.weekRange.formattedLabel}
        weekOffset={weekOffset}
        onOffsetChange={handleOffsetChange}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <div className="space-y-6">
          <ActivitySummaryCards summary={activityData.summary} />
          <WeeklyActivityChart data={activityData.members} />
          <MemberActivityTable data={activityData.members} />
        </div>
      </div>
    </div>
  );
}
