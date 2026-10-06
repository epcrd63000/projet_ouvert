"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from "lucide-react";

interface WeekNavigationProps {
  formattedLabel: string;
  weekOffset: number;
  onOffsetChange: (offset: number) => void;
  isLoading?: boolean;
}

/**
 * Sélecteur de navigation inter-semaines permettant de voyager dans l'historique d'activité.
 */
export function WeekNavigation({
  formattedLabel,
  weekOffset,
  onOffsetChange,
  isLoading = false,
}: WeekNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-md text-primary">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Période analysée
          </span>
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
          className="h-8 gap-1 px-2.5 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Précédente</span>
        </Button>

        {weekOffset !== 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOffsetChange(0)}
            disabled={isLoading}
            className="h-8 gap-1 px-2.5 text-xs font-medium"
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
          className="h-8 gap-1 px-2.5 text-xs"
        >
          <span className="hidden sm:inline">Suivante</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
