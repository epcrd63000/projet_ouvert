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
 * Le fond est une teinte légère et le filet gauche porte la couleur d'identité :
 * les pastilles restent lisibles dans les deux thèmes (les variables `--agenda-*`
 * basculent en mode sombre).
 */
export function getCalendarEventStyle(event: AppCalendarEvent) {
  let accent = "hsl(var(--agenda-task-mine))";
  let backgroundColor = "hsl(var(--agenda-task-mine-bg))";
  let color = "hsl(var(--agenda-task-mine-fg))";

  if (event.type === "meeting") {
    accent = "hsl(var(--agenda-meeting))";
    backgroundColor = "hsl(var(--agenda-meeting-bg))";
    color = "hsl(var(--agenda-meeting-fg))";
  } else if (event.type === "milestone") {
    accent = "hsl(var(--agenda-milestone))";
    backgroundColor = "hsl(var(--agenda-milestone-bg))";
    color = "hsl(var(--agenda-milestone-fg))";
  } else if (event.type === "manual") {
    // La couleur choisie par l'utilisateur reste portée par le filet gauche.
    accent = event.color || "hsl(var(--agenda-manual))";
    backgroundColor = "hsl(var(--agenda-manual-bg))";
    color = "hsl(var(--agenda-manual-fg))";
  } else if (event.type === "task") {
    if (event.isMine) {
      accent = "hsl(var(--agenda-task-mine))";
      backgroundColor = "hsl(var(--agenda-task-mine-bg))";
      color = "hsl(var(--agenda-task-mine-fg))";
    } else {
      accent = "hsl(var(--agenda-task-team))";
      backgroundColor = "hsl(var(--agenda-task-team-bg))";
      color = "hsl(var(--agenda-task-team-fg))";
    }
  }

  // Une tâche en retard prend le rouge coque, quel que soit son propriétaire.
  const isOverdue = event.type === "task" && event.isOverdue;

  return {
    style: {
      backgroundColor,
      borderLeft: `3px solid ${isOverdue ? "hsl(var(--destructive))" : accent}`,
      color,
      fontWeight: isOverdue ? 700 : 600,
    },
  };
}
