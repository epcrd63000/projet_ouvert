"use client";

import React, { useState, useEffect, useCallback } from "react";
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
 * Gère l'état de la semaine courante et orchestre la navigation temporelle.
 */
export function AdminActivityTab({ initialData }: AdminActivityTabProps) {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [activityData, setActivityData] = useState<AdminActivityDataResponse | null>(
    initialData || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [hasError, setHasError] = useState<boolean>(false);

  const fetchWeekData = useCallback(async (offset: number) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/admin/activity?weekOffset=${offset}`);
      if (!res.ok) {
        throw new Error("Impossible de récupérer les activités hebdomadaires");
      }
      const data: AdminActivityDataResponse = await res.json();
      setActivityData(data);
    } catch (err) {
      console.error("[AdminActivityTab] Erreur de chargement :", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Si nous changeons d'offset ou si initialData n'était pas fourni
    if (weekOffset !== 0 || !initialData) {
      fetchWeekData(weekOffset);
    }
  }, [weekOffset, fetchWeekData, initialData]);

  const handleOffsetChange = (newOffset: number) => {
    setWeekOffset(newOffset);
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5 space-y-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          Une erreur est survenue lors du chargement des statistiques d&apos;activité.
        </p>
        <Button variant="outline" size="sm" onClick={() => fetchWeekData(weekOffset)}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!activityData && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs">Chargement des données d&apos;activité hebdomadaire...</p>
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
