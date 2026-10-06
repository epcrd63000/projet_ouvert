"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, RefreshCw } from "lucide-react";

interface WeekNavigationProps {
  formattedLabel: string;
  weekOffset: number;
  onOffsetChange: (offset: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * Sélecteur de navigation inter-semaines permettant de voyager dans l'historique d'activité.
 * Indique clairement la semaine en cours et garantit un retour instantané en un clic.
 */
export function WeekNavigation({
  formattedLabel,
  weekOffset,
  onOffsetChange,
  onRefresh,
  isLoading = false,
}: WeekNavigationProps) {
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Période analysée
            </span>
            {isCurrentWeek ? (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1.5 py-0">
                Semaine en cours
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {weekOffset < 0 ? `S${weekOffset}` : `S+${weekOffset}`}
              </Badge>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            {formattedLabel}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOffsetChange(weekOffset - 1)}
          disabled={isLoading}
          className="h-8 gap-1 px-2.5 text-xs hover:bg-muted"
          title="Semaine précédente"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Précédente</span>
        </Button>

        {!isCurrentWeek && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onOffsetChange(0)}
            disabled={isLoading}
            className="h-8 gap-1 px-2.5 text-xs font-medium shadow-xs"
            title="Revenir immédiatement à la semaine courante"
          >
            <RotateCcw className="h-3 w-3" />
            Cette semaine
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onOffsetChange(weekOffset + 1)}
          disabled={isLoading}
          className="h-8 gap-1 px-2.5 text-xs hover:bg-muted"
          title="Semaine suivante"
        >
          <span className="hidden sm:inline">Suivante</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Actualiser les données de cette semaine"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </Button>
        )}
      </div>
    </div>
  );
}
