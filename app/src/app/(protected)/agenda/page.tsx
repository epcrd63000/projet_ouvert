"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, View, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CustomCalendarToolbar from "@/components/agenda/CustomCalendarToolbar";
import { EventModal, EventFormData } from "@/components/agenda/EventModal";
import { TaskSideDrawer } from "@/components/agenda/TaskSideDrawer";
import { AgendaHeader } from "@/components/agenda/AgendaHeader";
import { AgendaTask, AppCalendarEvent, TaskStatusType } from "@/components/agenda/agendaTypes";
import { calendarLocalizer, getCalendarEventStyle } from "@/components/agenda/agendaUtils";
import styles from "./agenda.module.css";

/**
 * Page Agenda avec calendrier mensuel interactif et volet latéral des tâches.
 */
export default function AgendaPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";

  const [events, setEvents] = useState<AppCalendarEvent[]>([]);
  const [drawerTasks, setDrawerTasks] = useState<AgendaTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"mine" | "all">("mine");

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/tasks?all=true"),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(
          eventsData.map((e: any) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end),
          }))
        );
      }

      if (tasksRes.ok) {
        const rawTasks = await tasksRes.json();
        const formattedTasks: AgendaTask[] = rawTasks.map((t: any) => {
          const isMine =
            t.assignments?.some((a: any) => a.userId === currentUserId) ||
            t.createdById === currentUserId;
          const isOverdue =
            !!(t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE");
          return {
            ...t,
            originalId: t.id,
            isMine,
            isOverdue,
            start: t.dueDate ? new Date(t.dueDate) : new Date(),
            end: t.dueDate ? new Date(t.dueDate) : new Date(),
          };
        });
        setDrawerTasks(formattedTasks);
      }
    } catch (error) {
      console.error("Erreur chargement agenda:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectEvent = (event: AppCalendarEvent) => {
    if (event.type === "meeting") {
      router.push(`/meetings/${event.originalId}`);
    } else if (event.type === "task") {
      setSelectedTaskId(event.originalId);
      setIsDrawerOpen(true);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatusType) => {
    setDrawerTasks((prev) =>
      prev.map((t) =>
        t.originalId === taskId
          ? {
              ...t,
              status: newStatus,
              progress: newStatus === "DONE" ? 100 : newStatus === "TODO" ? 0 : 50,
              isOverdue: newStatus === "DONE" ? false : t.isOverdue,
            }
          : t
      )
    );
    setEvents((prev) =>
      prev.map((e) =>
        e.originalId === taskId && e.type === "task"
          ? { ...e, status: newStatus, isOverdue: newStatus === "DONE" ? false : e.isOverdue }
          : e
      )
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
      fetchData();
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
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Erreur création événement:", error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className={`flex min-h-0 flex-col gap-5 ${styles.agendaPage}`}>
      <AgendaHeader
        tasksCount={drawerTasks.length}
        onOpenDrawer={() => {
          setSelectedTaskId(null);
          setIsDrawerOpen(true);
        }}
        onOpenNewEventModal={() => setIsModalOpen(true)}
      />

      <section
        aria-label="Calendrier du projet"
        className={`flex min-h-0 flex-1 flex-col rounded-xl border bg-card p-3 shadow-sm sm:p-5 ${styles.calendarPanel}`}
      >
        <Calendar
          localizer={calendarLocalizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="fr"
          date={currentDate}
          onNavigate={setCurrentDate}
          view={currentView}
          onView={setCurrentView}
          components={{ toolbar: CustomCalendarToolbar }}
          onSelectEvent={handleSelectEvent}
          className={`min-h-0 flex-1 ${styles.calendar}`}
          eventPropGetter={getCalendarEventStyle}
        />
      </section>

      <TaskSideDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        tasks={drawerTasks}
        selectedTaskId={selectedTaskId}
        onSelectTask={(id) => setSelectedTaskId(id)}
        onStatusChange={handleStatusChange}
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
      />

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}
