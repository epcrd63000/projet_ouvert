"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, differenceInDays, min, max, addDays } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { BarChart3 } from "lucide-react";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  color: string;
}

interface AppEvent {
  id: string;
  title: string;
  start: string;
  type: "meeting" | "task";
}

export default function GanttPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [resMilestones, resEvents] = await Promise.all([
        fetch("/api/milestones"),
        fetch("/api/events"),
      ]);

      if (resMilestones.ok && resEvents.ok) {
        setMilestones(await resMilestones.json());
        setEvents(await resEvents.json());
      }
    } catch (error) {
      console.error("Erreur chargement Gantt:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  // Calcul des bornes du diagramme
  const allDates: Date[] = [];
  milestones.forEach((m) => {
    allDates.push(new Date(m.startDate), new Date(m.endDate));
  });
  events.forEach((e) => {
    allDates.push(new Date(e.start));
  });

  const minDate = allDates.length > 0 ? min(allDates) : new Date();
  const maxDate = allDates.length > 0 ? addDays(max(allDates), 7) : addDays(new Date(), 30);
  const totalDays = Math.max(1, differenceInDays(maxDate, minDate));

  // Tâches
  const tasks = events.filter((e) => e.type === "task");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diagramme de Gantt</h1>
            <p className="text-muted-foreground">Jalons du projet et échéances des tâches</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-card rounded-lg border shadow-sm p-4">
        <div className="min-w-[800px] space-y-4">
          
          {/* Axe du temps abstrait */}
          <div className="relative h-8 border-b flex items-end">
            <div className="absolute left-0 text-xs text-muted-foreground">
              {format(minDate, "dd MMM yyyy", { locale: fr })}
            </div>
            <div className="absolute right-0 text-xs text-muted-foreground">
              {format(maxDate, "dd MMM yyyy", { locale: fr })}
            </div>
          </div>

          {/* Jalons (Milestones) */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Jalons</h3>
            {milestones.map((m) => {
              const startOffset = Math.max(0, differenceInDays(new Date(m.startDate), minDate));
              const duration = Math.max(1, differenceInDays(new Date(m.endDate), new Date(m.startDate)));
              const leftPercent = (startOffset / totalDays) * 100;
              const widthPercent = (duration / totalDays) * 100;

              return (
                <div key={m.id} className="relative h-8 group">
                  <div
                    className="absolute h-full rounded flex items-center px-2 text-xs text-white font-medium truncate cursor-pointer transition-transform hover:scale-[1.01]"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: m.color || "#6366f1",
                    }}
                    title={`${m.name} (${format(new Date(m.startDate), "dd/MM")} - ${format(new Date(m.endDate), "dd/MM")})`}
                  >
                    {m.name}
                  </div>
                </div>
              );
            })}
            {milestones.length === 0 && <p className="text-sm text-muted-foreground">Aucun jalon.</p>}
          </div>

          {/* Tâches (Échéances) */}
          <div className="space-y-2 mt-6">
            <h3 className="font-semibold text-sm">Échéances des tâches</h3>
            {tasks.map((t) => {
              const startOffset = Math.max(0, differenceInDays(new Date(t.start), minDate));
              const leftPercent = (startOffset / totalDays) * 100;

              return (
                <div key={t.id} className="relative h-6 group">
                  <div
                    className="absolute h-4 w-4 -mt-1 rounded-full bg-indigo-500 shadow-sm cursor-pointer"
                    style={{ left: `calc(${leftPercent}% - 8px)` }}
                    title={`${t.title} (${format(new Date(t.start), "dd/MM")})`}
                  />
                  <div
                    className="absolute h-full flex items-center px-2 text-xs truncate"
                    style={{ left: `${leftPercent}%` }}
                  >
                    {t.title}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">Aucune tâche avec date d&apos;échéance.</p>}
          </div>

        </div>
      </div>
    </div>
  );
}
