"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useRouter } from "next/navigation";
import CustomCalendarToolbar from "@/components/agenda/CustomCalendarToolbar";
import { View, Views } from "react-big-calendar";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventModal, EventFormData } from "@/components/agenda/EventModal";

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
  type: "meeting" | "task" | "manual";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    } else if (event.type === "task") {
      router.push("/kanban");
    }
    // manual events just show details maybe, but we're not adding a details modal yet
  };

  const handleCreateEvent = async (data: EventFormData) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startAt: new Date(data.startAt).toISOString(),
          endAt: new Date(data.endAt).toISOString(),
        }),
      });

      if (res.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error("Erreur création événement:", error);
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
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvel événement
        </Button>
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
            let backgroundColor = "hsl(var(--primary))"; // Couleur par défaut
            if (event.type === "meeting") {
              backgroundColor = "hsl(var(--accent))"; 
            } else if (event.type === "manual") {
              backgroundColor = "#10b981"; // Vert pour manuel
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

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}
