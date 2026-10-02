import type { KanbanTask } from "@/components/kanban/KanbanBoard";

/**
 * Nettoie et échappe une chaîne de caractères pour le format CSV.
 */
function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  BLOCKED: "Bloquée",
};

/**
 * Exporte une liste de tâches au format CSV conforme au standard IMT M2V5.
 * Utilise le point-virgule et le BOM UTF-8 pour une compatibilité native avec Excel français.
 */
export function exportTasksToCsv(tasks: KanbanTask[], filename = "suivi_taches_m2v5.csv"): void {
  const headers = [
    "Tâche",
    "Pilote",
    "Échéance",
    "Charge",
    "Livrables",
    "Priorité",
    "Qui valide / Comment",
    "% Avancement",
    "Statut",
    "Dernière MAJ",
    "Retard / Cause",
  ];

  const rows = tasks.map((task) => {
    const assignees = task.assignments?.map((a) => a.user.name).join(", ") || 
      (task.createdBy ? `Créé par ${task.createdBy.name}` : "Non assigné");
    
    const dueDateFormatted = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("fr-FR")
      : "";

    const updatedAtFormatted = task.updatedAt
      ? new Date(task.updatedAt).toLocaleDateString("fr-FR")
      : "";

    const progressValue = task.progress ?? (task.status === "DONE" ? 100 : 0);

    return [
      escapeCsvValue(task.title),
      escapeCsvValue(assignees),
      escapeCsvValue(dueDateFormatted),
      escapeCsvValue(task.workload || ""),
      escapeCsvValue(task.deliverables || ""),
      escapeCsvValue(PRIORITY_LABELS[task.priority] || task.priority),
      escapeCsvValue(task.validationCriteria || ""),
      escapeCsvValue(`${progressValue}%`),
      escapeCsvValue(STATUS_LABELS[task.status] || task.status),
      escapeCsvValue(updatedAtFormatted),
      escapeCsvValue(task.delayReason || ""),
    ].join(";");
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
