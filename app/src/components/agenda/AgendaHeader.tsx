"use client";

import React from "react";
import { CalendarDays, Plus, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendaHeaderProps {
  tasksCount: number;
  onOpenDrawer: () => void;
  onOpenNewEventModal: () => void;
}

const LEGEND_ITEMS = [
  { label: "Réunion", varName: "meeting" },
  { label: "Mes tâches", varName: "task-mine" },
  { label: "Tâches équipe", varName: "task-team" },
  { label: "Jalon", varName: "milestone" },
  { label: "Événement", varName: "manual" },
];

/**
 * En-tête de la page Agenda avec légende des couleurs et boutons d'action.
 */
export function AgendaHeader({
  tasksCount,
  onOpenDrawer,
  onOpenNewEventModal,
}: AgendaHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">Réunions, échéances et jalons du projet</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Légende détaillée des couleurs */}
        <div
          aria-label="Légende des événements"
          className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
        >
          {LEGEND_ITEMS.map(({ label, varName }) => (
            <span key={varName} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: `hsl(var(--agenda-${varName}))` }}
              />
              {label}
            </span>
          ))}
        </div>

        {/* Bouton d'ouverture du volet des tâches */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDrawer}
          className="gap-2 border-primary/30 hover:border-primary"
        >
          <ListTodo className="h-4 w-4 text-primary" /> Volet des tâches ({tasksCount})
        </Button>

        {/* Bouton de création d'événement */}
        <Button onClick={onOpenNewEventModal} className="gap-2" size="sm">
          <Plus className="h-4 w-4" /> Nouvel événement
        </Button>
      </div>
    </header>
  );
}
