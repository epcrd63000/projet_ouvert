export type InfoCategory =
  | "ALL"
  | "ORGANISATION"
  | "CALENDRIER"
  | "TECHNIQUE"
  | "GENERAL";

export interface ImportantInfoItem {
  id: string;
  title: string;
  content: string;
  category: string;
  eventDate: string | Date | null;
  interlocutors: string | null;
  isPinned: boolean;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InfoFormData {
  title: string;
  content: string;
  category: string;
  eventDate: string;
  interlocutors: string;
  isPinned: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
  ALL: "Toutes les fiches",
  ORGANISATION: "Organisation & Équipe",
  CALENDRIER: "Calendrier & Jalons",
  TECHNIQUE: "Dossier Technique MINIMOCA",
  GENERAL: "Général & Consignes",
};

export const CATEGORY_COLORS: Record<string, string> = {
  ORGANISATION: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  CALENDRIER: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  TECHNIQUE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  GENERAL: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};
