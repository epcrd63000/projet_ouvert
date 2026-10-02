"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MeetingModal, MeetingFormData } from "@/components/meetings/MeetingModal";
import { Users as UsersIcon, Plus, Calendar, Clock, Download, CheckSquare, Square } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { marked } from "marked";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  reportContent?: string | null;
  isReportDownloaded: boolean;
  attendees: { user: User }[];
}

export default function MeetingsPage() {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Erreur chargement réunions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, [fetchMeetings, fetchUsers]);

  const handleCreateMeeting = async (data: MeetingFormData) => {
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Réunion créée avec succès");
        fetchMeetings();
      } else {
        const err = await res.json();
        toast.error(err.error || "Impossible de créer la réunion");
      }
    } catch (error) {
      console.error("Erreur création réunion:", error);
      toast.error("Erreur de connexion lors de la création");
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedMeetings);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMeetings(newSet);
  };

  const handleBatchExport = async () => {
    if (selectedMeetings.size === 0) return;
    setIsExporting(true);
    
    try {
      const zip = new JSZip();
      const tempDiv = document.createElement("div");
      tempDiv.style.padding = "40px";
      tempDiv.style.fontFamily = "sans-serif";
      tempDiv.style.color = "#000";
      tempDiv.style.background = "#fff";
      tempDiv.style.width = "800px";
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px"; // hide it
      
      const style = document.createElement("style");
      style.innerHTML = `
        h1 { color: #1a56db; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        h2 { color: #2563eb; font-size: 20px; margin-top: 20px; }
        p { line-height: 1.6; margin-bottom: 12px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 4px; }
        strong { color: #111827; }
      `;
      tempDiv.appendChild(style);
      document.body.appendChild(tempDiv);

      const meetingsToExport = meetings.filter(m => selectedMeetings.has(m.id));

      for (const meeting of meetingsToExport) {
        if (!meeting.reportContent) continue;

        // Convert markdown to HTML using marked
        const htmlContent = await marked.parse(meeting.reportContent);
        const contentContainer = document.createElement("div");
        contentContainer.innerHTML = htmlContent;
        tempDiv.appendChild(contentContainer);

        const canvas = await html2canvas(tempDiv, { scale: 2 });
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        
        const pdfBlob = pdf.output("blob");
        const safeTitle = meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        zip.file(`Compte_Rendu_${safeTitle}.pdf`, pdfBlob);
        
        tempDiv.removeChild(contentContainer); // clean up for next

        // Update downloaded status in DB
        if (!meeting.isReportDownloaded) {
            await fetch(`/api/meetings/${meeting.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isReportDownloaded: true }),
            });
        }
      }

      document.body.removeChild(tempDiv);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Comptes_Rendus_Reunions.zip");
      toast.success("Archive ZIP téléchargée avec succès");
      
      // Clear selection and refresh
      setSelectedMeetings(new Set());
      fetchMeetings();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'exportation par lot.");
    } finally {
      setIsExporting(false);
    }
  };


  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNED":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Planifiée</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Terminée</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Réunions</h1>
            <p className="text-muted-foreground">Planification et comptes rendus</p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {selectedMeetings.size > 0 && (
            <Button onClick={handleBatchExport} variant="secondary" disabled={isExporting} className="gap-2">
              <Download className="h-4 w-4" /> 
              {isExporting ? "Création ZIP..." : `Exporter ${selectedMeetings.size} compte(s) rendu(s)`}
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Nouvelle réunion
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-10">Aucune réunion prévue.</p>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="relative rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              
              <div className="absolute top-4 left-4 z-10 cursor-pointer" onClick={() => toggleSelection(meeting.id)}>
                {selectedMeetings.has(meeting.id) ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground hover:text-primary" />
                )}
              </div>

              <div className="pl-8">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold text-lg line-clamp-1 ${meeting.isReportDownloaded ? 'text-green-600' : 'text-red-600'}`} title={meeting.title}>
                    {meeting.title}
                  </h3>
                  {getStatusBadge(meeting.status)}
                </div>
                
                <div className="space-y-1 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="capitalize">{format(new Date(meeting.scheduledAt), "EEEE d MMMM yyyy", { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(meeting.scheduledAt), "HH:mm", { locale: fr })}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-sm">
                  <span className="font-medium text-foreground block mb-1">Participants:</span>
                  <p className="text-muted-foreground line-clamp-2">
                    {meeting.attendees.map((a) => a.user.name).join(", ") || "Aucun"}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link href={`/meetings/${meeting.id}`}>
                  <Button variant="secondary" className="w-full font-medium">Voir le compte rendu</Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <MeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMeeting}
        users={users}
      />
    </div>
  );
}
