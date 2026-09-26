"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useRouter } from "next/navigation";
import CustomCalendarToolbar from "@/components/agenda/CustomCalendarToolbar";
import { View, Views } from "react-big-calendar";
import { CalendarDays } from "lucide-react";

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "meeting" | "task";
  status: string;
  originalId: string;
  allDay?: boolean;
}

export default function AgendaPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        const formattedEvents = data.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Erreur chargement événements:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectEvent = (event: AppEvent) => {
    if (event.type === "meeting") {
      router.push(`/meetings/${event.originalId}`);
    } else {
      router.push("/kanban");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
            <p className="text-muted-foreground">Calendrier des réunions et des échéances</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card p-4 rounded-lg border shadow-sm flex flex-col">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="fr"
          date={currentDate}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          view={currentView}
          onView={(newView) => setCurrentView(newView)}
          components={{
            toolbar: CustomCalendarToolbar,
          }}
          onSelectEvent={handleSelectEvent}
          className="flex-1"
          eventPropGetter={(event) => {
            let backgroundColor = "hsl(var(--primary))"; // Couleur par défaut (thème dynamique)
            if (event.type === "meeting") {
              backgroundColor = "hsl(var(--accent))"; 
            }
            return { 
              style: { 
                backgroundColor,
                border: "none",
                borderRadius: "4px",
                color: "hsl(var(--primary-foreground))"
              } 
            };
          }}
        />
      </div>
    </div>
  );
}
