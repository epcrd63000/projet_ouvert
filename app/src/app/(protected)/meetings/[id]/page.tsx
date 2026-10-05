"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MeetingReportEditor } from "@/components/meetings/MeetingReportEditor";
import { MeetingAttendanceCard, AttendanceStatus } from "@/components/meetings/MeetingAttendanceCard";
import { MeetingDecisionsCard } from "@/components/meetings/MeetingDecisionsCard";
import { MeetingAiAssistantDrawer } from "@/components/meetings/MeetingAiAssistantDrawer";
import { generateAndDownloadMeetingPdf } from "@/lib/meetings/meetingPdfGenerator";
import { ParsedMeetingReport } from "@/lib/meetings/aiReportParser";
import { Bot, Download, ArrowLeft, Trash2, Save, Calendar, MapPin, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface MeetingDetail {
  id: string;
  title: string;
  scheduledAt: string;
  status: "PLANNED" | "IN_PROGRESS" | "DONE";
  location?: string | null;
  objectives?: string | null;
  notes?: string | null;
  reportContent?: string | null;
  isReportDownloaded: boolean;
  createdBy: User | null;
  attendees: Array<{
    id: string;
    status: AttendanceStatus;
    user: User;
  }>;
  decisions: Array<{
    id: string;
    content: string;
    assigneeId?: string | null;
    assigneeIds?: string[];
    dueDate?: string | null;
    taskId?: string | null;
    assignee?: User | null;
    task?: { id: string; title: string; status: string; progress: number } | null;
  }>;
}

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [objectives, setObjectives] = useState("");
  const [currentReportContent, setCurrentReportContent] = useState("");
  const [externalContentKey, setExternalContentKey] = useState(0);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setObjectives(data.objectives || "");
        setCurrentReportContent(data.reportContent || "");
      } else {
        router.push("/meetings");
      }
    } catch (error) {
      console.error("Erreur chargement réunion:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  }, []);

  useEffect(() => {
    fetchMeeting();
    fetchUsers();
  }, [fetchMeeting, fetchUsers]);

  const handleStatusChange = async (newStatus: "PLANNED" | "IN_PROGRESS" | "DONE") => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Statut mis à jour : ${newStatus}`);
        fetchMeeting();
      }
    } catch {
      toast.error("Erreur mise à jour statut");
    }
  };

  const handleDeleteMeeting = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette réunion ?")) return;
    try {
      const res = await fetch(`/api/meetings/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Réunion supprimée avec succès");
        router.push("/meetings");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSaveObjectives = async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectives }),
      });
      if (res.ok) toast.success("Objectifs enregistrés");
    } catch {
      toast.error("Erreur enregistrement objectifs");
    }
  };

  const handleSaveReportContent = async (markdown: string) => {
    try {
      setCurrentReportContent(markdown);
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportContent: markdown }),
      });
      if (res.ok) {
        toast.success("Compte rendu enregistré avec succès");
        fetchMeeting();
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleAttendanceChange = async (attendeeId: string, status: AttendanceStatus) => {
    // 1. Mise à jour optimiste immédiate dans l'état local (0ms de latence perçue)
    setMeeting((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        attendees: prev.attendees.map((a) =>
          a.id === attendeeId ? { ...a, status } : a
        ),
      };
    });

    try {
      const res = await fetch(`/api/meetings/${params.id}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId, status }),
      });
      if (res.ok) {
        toast.success("Émargement mis à jour");
      } else {
        toast.error("Erreur lors de la mise à jour de l'émargement");
        fetchMeeting();
      }
    } catch {
      toast.error("Erreur de connexion");
      fetchMeeting();
    }
  };

  const handleAddDecision = async (
    content: string,
    assigneeId: string | null,
    dueDate: string | null,
    assigneeIds?: string[]
  ) => {
    const res = await fetch(`/api/meetings/${params.id}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, assigneeId, dueDate, assigneeIds }),
    });
    if (res.ok) fetchMeeting();
  };

  const handleUpdateDecision = async (
    decisionId: string,
    content: string,
    assigneeId: string | null,
    dueDate: string | null,
    assigneeIds?: string[]
  ) => {
    try {
      const res = await fetch(`/api/meetings/${params.id}/decisions/${decisionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, assigneeId, dueDate, assigneeIds }),
      });
      if (res.ok) {
        toast.success("Décision mise à jour");
        fetchMeeting();
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur de connexion serveur");
    }
  };

  const handleDeleteDecision = async (decisionId: string) => {
    const res = await fetch(`/api/meetings/${params.id}/decisions/${decisionId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Décision supprimée");
      fetchMeeting();
    }
  };

  const handleConvertToTask = async (decisionId: string) => {
    const res = await fetch(`/api/meetings/${params.id}/decisions/${decisionId}/convert`, { method: "POST" });
    if (res.ok) fetchMeeting();
  };

  const handleConvertAllToTasks = async () => {
    if (!meeting) return;
    const unconverted = meeting.decisions.filter((d) => !d.taskId);
    if (unconverted.length === 0) {
      toast.info("Toutes les décisions sont déjà converties en tâches");
      return;
    }

    try {
      for (const dec of unconverted) {
        await fetch(`/api/meetings/${params.id}/decisions/${dec.id}/convert`, { method: "POST" });
      }
      toast.success(`${unconverted.length} tâche(s) créée(s) avec succès !`);
      fetchMeeting();
    } catch {
      toast.error("Erreur lors de la conversion groupée");
    }
  };

  const handleApplyAiReport = async (parsed: ParsedMeetingReport) => {
    // 1. Mise à jour réactive immédiate de l'interface (0ms d'attente)
    setObjectives(parsed.objectives);
    setCurrentReportContent(parsed.synthesis);
    setExternalContentKey((k) => k + 1);
    setMeeting((prev) =>
      prev
        ? {
            ...prev,
            objectives: parsed.objectives,
            reportContent: parsed.synthesis,
          }
        : null
    );

    // 2. Sauvegarde asynchrone des objectifs et de la synthèse
    await fetch(`/api/meetings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectives: parsed.objectives,
        reportContent: parsed.synthesis,
      }),
    });

    // 3. Sauvegarde des décisions extraites
    for (const dec of parsed.decisions) {
      await fetch(`/api/meetings/${params.id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: dec.content,
          assigneeId: dec.assigneeId,
          dueDate: dec.dueDate,
        }),
      });
    }

    fetchMeeting();
  };

  const handleExportPdf = async () => {
    if (!meeting) return;
    try {
      setIsExportingPdf(true);

      // 1. Auto-sauvegarde transparente en base avant génération du PDF officiel
      await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectives,
          reportContent: currentReportContent,
          isReportDownloaded: true,
        }),
      });

      // 2. Génération du PDF avec les données 100% à jour
      await generateAndDownloadMeetingPdf({
        id: meeting.id,
        title: meeting.title,
        scheduledAt: meeting.scheduledAt,
        location: meeting.location,
        status: meeting.status,
        organizerName: meeting.createdBy?.name,
        objectives,
        reportContent: currentReportContent,
        attendees: meeting.attendees,
        decisions: meeting.decisions,
      });

      fetchMeeting();
      toast.success("Compte rendu sauvegardé et PDF officiel téléchargé !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading || !meeting) {
    return <div className="p-8 text-center text-muted-foreground">Chargement de la réunion...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Barre de navigation et Actions principales */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/meetings")} className="-ml-3 mb-1 gap-1">
            <ArrowLeft className="h-4 w-4" /> Réunions
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{meeting.title}</h1>
            <Badge variant="outline" className={meeting.isReportDownloaded ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
              {meeting.isReportDownloaded ? "PDF Téléchargé" : "Brouillon"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(meeting.scheduledAt).toLocaleString("fr-FR")}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {meeting.location || "Non spécifié"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={meeting.status}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
          >
            <option value="PLANNED">Planifiée</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="DONE">Terminée</option>
          </select>

          <Button variant="outline" onClick={() => setIsAiDrawerOpen(true)} className="gap-2 text-primary border-primary/30 hover:bg-primary/5">
            <Bot className="h-4 w-4" /> Assistant IA
          </Button>

          <Button onClick={handleExportPdf} disabled={isExportingPdf} className="gap-2">
            <Download className="h-4 w-4" /> {isExportingPdf ? "Génération..." : "Export PDF Officiel"}
          </Button>

          {(isAdmin || session?.user?.id === meeting.createdBy?.id) && (
            <Button variant="destructive" onClick={handleDeleteMeeting} className="gap-2">
              <Trash2 className="h-4 w-4" /> Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Colonne latérale gauche : Émargement et Infos */}
        <div className="md:col-span-4 space-y-6">
          <MeetingAttendanceCard
            meetingId={meeting.id}
            attendees={meeting.attendees}
            onAttendanceChange={handleAttendanceChange}
          />
        </div>

        {/* Colonne centrale : Objectifs, Synthèse TipTap et Décisions */}
        <div className="md:col-span-8 space-y-6">
          {/* Objectifs / Ordre du jour */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">1. Objectifs &amp; Ordre du Jour</h2>
              <Button variant="ghost" size="sm" onClick={handleSaveObjectives} className="h-7 text-xs gap-1">
                <Save className="h-3.5 w-3.5" /> Enregistrer
              </Button>
            </div>
            <Textarea
              placeholder="Listez les objectifs ou l'ordre du jour convenu..."
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              className="text-sm min-h-[70px]"
            />
          </div>

          {/* Éditeur de Synthèse Markdown */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">2. Synthèse des Échanges (Markdown)</h2>
            <MeetingReportEditor
              meetingId={meeting.id}
              initialContent={currentReportContent}
              externalContentKey={externalContentKey}
              onSave={handleSaveReportContent}
              onChange={(markdown) => setCurrentReportContent(markdown)}
            />
          </div>

          {/* Relevé de Décisions & Plan d'Action */}
          <MeetingDecisionsCard
            meetingId={meeting.id}
            decisions={meeting.decisions}
            users={users}
            onAddDecision={handleAddDecision}
            onUpdateDecision={handleUpdateDecision}
            onDeleteDecision={handleDeleteDecision}
            onConvertToTask={handleConvertToTask}
            onConvertAllToTasks={handleConvertAllToTasks}
          />
        </div>
      </div>

      {/* Assistant IA Modal / Drawer */}
      <MeetingAiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        meeting={meeting}
        users={users}
        onApplyReport={handleApplyAiReport}
      />
    </div>
  );
}
