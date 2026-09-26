"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, differenceInDays, min, max, addDays } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { BarChart3, X } from "lucide-react";

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
  
  const [selectedItem, setSelectedItem] = useState<{
    type: "milestone" | "task";
    title: string;
    description?: string;
    start: string;
    end?: string;
    status?: string;
  } | null>(null);

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
          
          <div className="relative h-8 border-b flex items-end">
            <div className="absolute left-0 text-xs text-muted-foreground">
              {format(minDate, "dd MMM yyyy", { locale: fr })}
            </div>
            <div className="absolute right-0 text-xs text-muted-foreground">
              {format(maxDate, "dd MMM yyyy", { locale: fr })}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Jalons</h3>
            {milestones.map((m) => {
              const startOffset = Math.max(0, differenceInDays(new Date(m.startDate), minDate));
              const duration = Math.max(1, differenceInDays(new Date(m.endDate), new Date(m.startDate)));
              const leftPercent = (startOffset / totalDays) * 100;
              const widthPercent = (duration / totalDays) * 100;

              return (
                <div key={m.id} className="relative h-8 group mb-2">
                  <div
                    onClick={() => setSelectedItem({
                      type: "milestone",
                      title: m.name,
                      description: m.description || "Aucune description",
                      start: m.startDate,
                      end: m.endDate,
                      status: m.status
                    })}
                    className="absolute h-full rounded flex items-center px-2 text-xs text-white font-medium cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-md"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(widthPercent, 1)}%`,
                      backgroundColor: m.color || "#6366f1",
                      minWidth: "24px"
                    }}
                    title={`${m.name} (${format(new Date(m.startDate), "dd/MM")} - ${format(new Date(m.endDate), "dd/MM")})`}
                  >
                    <span className="truncate w-full">{m.name}</span>
                  </div>
                </div>
              );
            })}
            {milestones.length === 0 && <p className="text-sm text-muted-foreground">Aucun jalon.</p>}
          </div>

          <div className="space-y-2 mt-8 border-t pt-4">
            <h3 className="font-semibold text-sm">Échéances des tâches</h3>
            {tasks.map((t) => {
              const startOffset = Math.max(0, differenceInDays(new Date(t.start), minDate));
              const leftPercent = (startOffset / totalDays) * 100;

              return (
                <div key={t.id} className="relative h-6 group mb-2">
                  <div
                    onClick={() => setSelectedItem({
                      type: "task",
                      title: t.title,
                      start: t.start,
                    })}
                    className="absolute h-4 w-4 -mt-1 rounded-full bg-indigo-500 shadow-sm cursor-pointer hover:scale-125 transition-transform"
                    style={{ left: `calc(${leftPercent}% - 8px)` }}
                    title={`${t.title} (${format(new Date(t.start), "dd/MM")})`}
                  />
                  <div
                    className="absolute h-full flex items-center px-2 text-xs truncate"
                    style={{ left: `${leftPercent}%`, marginLeft: "8px" }}
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

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl border w-full max-w-md overflow-hidden relative">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-6">
              <div className="text-xs uppercase font-semibold text-muted-foreground mb-1 tracking-wider">
                {selectedItem.type === "milestone" ? "Détails du jalon" : "Détails de la tâche"}
              </div>
              <h2 className="text-xl font-bold mb-4 pr-6 leading-tight">{selectedItem.title}</h2>
              
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-muted-foreground font-medium">Début:</span>
                  <span>{format(new Date(selectedItem.start), "dd MMMM yyyy", { locale: fr })}</span>
                </div>
                
                {selectedItem.end && (
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground font-medium">Fin:</span>
                    <span>{format(new Date(selectedItem.end), "dd MMMM yyyy", { locale: fr })}</span>
                  </div>
                )}
                
                {selectedItem.status && (
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground font-medium">Statut:</span>
                    <span>{selectedItem.status}</span>
                  </div>
                )}
                
                {selectedItem.description && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="block text-muted-foreground font-medium mb-1">Description:</span>
                    <p className="whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-muted p-4 text-right">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
