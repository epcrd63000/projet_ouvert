"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
}

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  attendees: { user: User }[];
  createdBy: User;
}

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function MeetingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [prompts, setPrompts] = useState<{ id: string; title: string; content: string }[]>([]);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setNotes(data.notes || "");
      } else {
        router.push("/meetings");
      }
    } catch (error) {
      console.error("Erreur chargement réunion:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  const [promptsError, setPromptsError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
        setPromptsError(null);
      } else {
        setPromptsError("Impossible de charger les modèles.");
      }
    } catch (err) {
      console.error("Erreur chargement prompts:", err);
      setPromptsError("Erreur de réseau.");
    }
  }, []);

  useEffect(() => {
    fetchMeeting();
    fetchPrompts();
  }, [fetchMeeting, fetchPrompts]);

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert("Modèle copié dans le presse-papier !");
      setIsPromptsOpen(false);
    } catch (err) {
      console.error("Erreur copie", err);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        fetchMeeting();
        alert("Compte rendu enregistré avec succès.");
      }
    } catch (error) {
      console.error("Erreur sauvegarde notes:", error);
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

  const handleExportPDF = async () => {
    const element = document.getElementById("meeting-report-content");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // This moves the image up
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`compte-rendu-${meeting?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!meeting) {
    return null; // ou erreur
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <Button variant="ghost" onClick={() => router.push("/meetings")} className="mb-2">
            ← Retour aux réunions
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
          <p className="text-muted-foreground mt-1">
            Prévue le : {new Date(meeting.scheduledAt).toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2 relative">
          <div className="relative">
            <Button variant="outline" onClick={() => setIsPromptsOpen(!isPromptsOpen)}>
              ✨ Modèles IA
            </Button>
            {isPromptsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-popover text-popover-foreground border rounded-md shadow-lg z-50 overflow-hidden">
                <div className="p-2 border-b bg-muted/50">
                  <h4 className="text-sm font-semibold text-center">Modèles de Prompts</h4>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {promptsError ? (
                    <div className="p-3 text-sm text-destructive text-center">{promptsError}</div>
                  ) : prompts.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">Aucun modèle disponible</div>
                  ) : (
                    prompts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => copyToClipboard(p.content)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                      >
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground truncate mt-1">{p.content}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={handleExportPDF}>
            Exporter en PDF
          </Button>
          {isAdmin && (
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer la réunion
            </Button>
          )}
        </div>
      </div>

      <div id="meeting-report-content" className="grid gap-6 md:grid-cols-3 bg-background p-4 rounded-xl">
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 mb-2">Informations</h3>
            <p className="text-sm"><strong>Statut :</strong> {meeting.status}</p>
            <p className="text-sm"><strong>Créée par :</strong> {meeting.createdBy?.name}</p>
          </div>
          
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 mb-2">Participants ({meeting.attendees.length})</h3>
            <ul className="text-sm space-y-1">
              {meeting.attendees.map((a) => (
                <li key={a.user.id}>• {a.user.name}</li>
              ))}
              {meeting.attendees.length === 0 && <li className="text-muted-foreground">Aucun</li>}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 mb-2">Compte Rendu</h3>
            <textarea
              className="w-full min-h-[300px] p-3 rounded-md border text-sm"
              placeholder="Saisissez le compte rendu de la réunion ici..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveNotes} data-html2canvas-ignore>Enregistrer le compte rendu</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
