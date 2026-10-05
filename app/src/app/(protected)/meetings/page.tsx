"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MeetingModal, MeetingFormData } from "@/components/meetings/MeetingModal";
import { MeetingCard, MeetingListItem } from "@/components/meetings/MeetingCard";
import { Users as UsersIcon, Plus, Download } from "lucide-react";
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

export default function MeetingsPage() {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

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
      tempDiv.style.left = "-9999px";

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

      const meetingsToExport = meetings.filter((m) => selectedMeetings.has(m.id));
      let skippedCount = 0;

      for (const meeting of meetingsToExport) {
        if (!meeting.reportContent) {
          skippedCount++;
          continue;
        }

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
        const safeTitle = meeting.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        zip.file(`Compte_Rendu_${safeTitle}.pdf`, pdfBlob);

        tempDiv.removeChild(contentContainer);

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

      if (skippedCount > 0) {
        toast.warning(`Archive ZIP téléchargée. ${skippedCount} réunion(s) ignorée(s) car sans compte rendu.`);
      } else {
        toast.success("Archive ZIP téléchargée avec succès");
      }

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
    return <div className="p-8 text-center text-muted-foreground">Chargement des réunions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Réunions</h1>
            <p className="text-muted-foreground">Planification, ordre du jour, émargement et comptes rendus</p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {selectedMeetings.size > 0 && (
            <Button onClick={handleBatchExport} variant="secondary" disabled={isExporting} className="gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? "Création ZIP..." : `Exporter ${selectedMeetings.size} compte(s) rendu(s)`}
            </Button>
          )}
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nouvelle réunion
          </Button>
        </div>
      </div>

      {/* Grille des cartes de réunions avec accès rapide à l'ordre du jour */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-10">Aucune réunion prévue.</p>
        ) : (
          meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isSelected={selectedMeetings.has(meeting.id)}
              onToggleSelect={toggleSelection}
              currentUserName={session?.user?.name}
            />
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
