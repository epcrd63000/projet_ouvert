"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { MeetingReportEditor } from "@/components/meetings/MeetingReportEditor";
import { Copy, Bot } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  location?: string | null;
  notes?: string | null;
  reportContent?: string | null;
  isReportDownloaded: boolean;
  createdBy: User | null;
  attendees: { user: User }[];
}

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [prompts, setPrompts] = useState<{ id: string; title: string; content: string }[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
        if (data.length > 0) {
          setSelectedPromptId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Erreur chargement prompts:", error);
    }
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
      } else {
        router.push("/meetings");
      }
    } catch (error) {
      console.error("Erreur chargement réunion:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  const handleSaveReport = async (markdown: string) => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportContent: markdown }),
      });
      if (res.ok) {
        toast.success("Compte rendu enregistré avec succès.");
        fetchMeeting();
      } else {
        toast.error("Erreur lors de la sauvegarde.");
      }
    } catch (error) {
      console.error("Erreur sauvegarde reportContent:", error);
    }
  };

  const handleDownloaded = async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReportDownloaded: true }),
      });
      if (res.ok) {
        fetchMeeting();
      }
    } catch (error) {
      console.error("Erreur maj isReportDownloaded:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cette réunion ?")) return;
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/meetings");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  
  const getPromptText = () => {
    const p = prompts.find(p => p.id === selectedPromptId);
    if (!p) return "Aucun modèle de prompt disponible.";
    let txt = p.content;
    if (meeting) {
      txt = txt.replace(/\{meeting\.title\}/g, meeting.title);
      txt = txt.replace(/\{meeting\.date\}/g, new Date(meeting.scheduledAt).toLocaleDateString("fr-FR"));
      const attendeesList = meeting.attendees.map(a => a.user.name).join(", ");
      txt = txt.replace(/\{meeting\.attendees\}/g, attendeesList || "Aucun");
    }
    return txt;
  };


  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getPromptText());
      toast.success("Prompt IA copié dans le presse-papier !");
    } catch (err) {
      toast.error("Erreur lors de la copie.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!meeting) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <Button variant="ghost" onClick={() => router.push("/meetings")} className="mb-2 -ml-4">
            ← Retour aux réunions
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {meeting.title}
            {meeting.isReportDownloaded ? (
              <span className="text-xs font-normal px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                Téléchargé
              </span>
            ) : (
              <span className="text-xs font-normal px-2 py-1 bg-red-100 text-red-700 rounded-full border border-red-200">
                Non téléchargé
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Prévue le : {new Date(meeting.scheduledAt).toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer la réunion
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Colonne latérale */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-xl border bg-primary/5 p-4 shadow-sm border-primary/20">
            <h3 className="font-semibold pb-2 mb-2 flex items-center gap-2 text-primary">
              <Bot className="h-5 w-5" />
              Générer avec l&apos;IA
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Copiez ce prompt pré-formaté, collez-le dans ChatGPT/Claude avec votre transcription, puis collez le résultat Markdown dans l&apos;éditeur.
            </p>
            <Button onClick={handleCopyPrompt} className="w-full flex gap-2">
              <Copy className="h-4 w-4" /> Copier le Prompt IA
            </Button>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 mb-2">Informations</h3>
            <p className="text-sm mb-1"><strong>Statut :</strong> {meeting.status}</p>
            <p className="text-sm"><strong>Créée par :</strong> {meeting.createdBy?.name}</p>
          </div>
          
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 mb-2">Participants ({meeting.attendees.length})</h3>
            <ul className="text-sm space-y-1">
              {meeting.attendees.map((a) => (
                <li key={a.user.id}>? {a.user.name}</li>
              ))}
              {meeting.attendees.length === 0 && <li className="text-muted-foreground">Aucun</li>}
            </ul>
          </div>
        </div>

        {/* Éditeur Markdown */}
        <div className="md:col-span-3 space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col h-full min-h-[500px]">
            <h3 className="font-semibold mb-4 text-lg">Compte Rendu (Markdown)</h3>
            <div className="flex-1">
              <MeetingReportEditor 
                meetingId={meeting.id}
                initialContent={meeting.reportContent || ""}
                isDownloaded={meeting.isReportDownloaded}
                onSave={handleSaveReport}
                onDownloaded={handleDownloaded}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
