import { AppCalendarEvent } from "./agendaTypes";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { dateFnsLocalizer } from "react-big-calendar";

export const locales = { fr };

export const calendarLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

/**
 * Calcule les styles visuels d'un événement selon son type et sa portée (perso vs équipe).
 */
export function getCalendarEventStyle(event: AppCalendarEvent) {
  let backgroundColor = "hsl(var(--agenda-task-mine))";
  let color = "hsl(var(--agenda-task-mine-foreground))";
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
  } else if (event.type === "task") {
    if (event.isMine) {
      backgroundColor = "hsl(var(--agenda-task-mine))";
      color = "hsl(var(--agenda-task-mine-foreground))";
    } else {
      backgroundColor = "hsl(var(--agenda-task-team))";
      color = "hsl(var(--agenda-task-team-foreground))";
    }

    if (event.isOverdue) {
      border = "2px solid hsl(0 84% 60%)";
    }
  }

  return {
    style: {
      backgroundColor,
      border,
      borderRadius: "4px",
      color,
      fontWeight: 600,
    },
  };
}
