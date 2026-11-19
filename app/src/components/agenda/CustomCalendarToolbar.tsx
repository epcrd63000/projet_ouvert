"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = ["month", "week", "day", "agenda"] as const;

const VIEW_NAMES: Record<string, string> = {
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Planning",
};

/**
 * Barre d'outils du calendrier : navigation, période affichée et sélecteur de vue.
 */
export default function CustomCalendarToolbar(props: any) {
  const { onNavigate, label, view, onView } = props;

  return (
    <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      {/* Navigation : aujourd'hui + pas à pas */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={() => onNavigate("TODAY")}>
          Aujourd&apos;hui
        </Button>
        <div className="flex items-center overflow-hidden rounded-md border border-border bg-card">
          <button
            type="button"
            onClick={() => onNavigate("PREV")}
            aria-label="Période précédente"
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={() => onNavigate("NEXT")}
            aria-label="Période suivante"
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Période affichée */}
      <p className="text-base font-semibold capitalize tracking-tight" aria-live="polite">
        {label}
      </p>

      {/* Sélecteur de vue */}
      <div
        role="group"
        aria-label="Type de vue du calendrier"
        className="flex items-center gap-1 rounded-lg bg-muted p-1"
      >
        {VIEWS.map((v) => {
          const isActive = view === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              aria-pressed={isActive}
              className={cn(
                "h-7 rounded-md px-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {VIEW_NAMES[v]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
