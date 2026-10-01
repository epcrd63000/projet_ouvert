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
import styles from "./agenda.module.css";

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
  type: "meeting" | "task" | "manual" | "milestone";
  status: string;
  originalId: string;
  allDay?: boolean;
  isMine?: boolean;
  color?: string;
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
    <div className={`flex min-h-0 flex-col gap-5 ${styles.agendaPage}`}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
            <p className="text-sm text-muted-foreground">Réunions, échéances et jalons du projet</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div aria-label="Légende des événements" className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {[
              ["Réunion", "meeting"],
              ["Tâche", "task"],
              ["Jalon", "milestone"],
              ["Événement", "manual"],
            ].map(([label, type]) => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: `hsl(var(--agenda-${type}))` }}
                />
                {label}
              </span>
            ))}
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2" size="sm">
            <Plus className="h-4 w-4" /> Nouvel événement
          </Button>
        </div>
      </header>

      <section
        aria-label="Calendrier du projet"
        className={`flex min-h-0 flex-1 flex-col rounded-xl border bg-card p-3 shadow-sm sm:p-5 ${styles.calendarPanel}`}
      >
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
          className={`min-h-0 flex-1 ${styles.calendar}`}
          eventPropGetter={(event: AppEvent) => {
            let backgroundColor = "hsl(var(--agenda-task))";
            let color = "hsl(var(--agenda-task-foreground))";
            let border = "1px solid transparent";

            if (event.type === "meeting") {
              backgroundColor = "hsl(var(--agenda-meeting))";
              color = "hsl(var(--agenda-meeting-foreground))";
            } else if (event.type === "milestone") {
              backgroundColor = "hsl(var(--agenda-milestone))";
              color = "hsl(var(--agenda-milestone-foreground))";
            } else if (event.type === "manual") {
              backgroundColor = event.color || "hsl(var(--agenda-manual))";
              color = "hsl(var(--agenda-manual-foreground))";
            }

            if (event.type === "task" && event.isMine === false) {
              border = "1px dashed hsl(var(--agenda-task-foreground) / 0.7)";
            }

            return {
              style: {
                backgroundColor,
                border,
                borderRadius: "4px",
                color,
              },
            };
          }}
        />
      </section>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}
