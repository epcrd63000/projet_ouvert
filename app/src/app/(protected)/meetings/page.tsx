"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MeetingModal, MeetingFormData } from "@/components/meetings/MeetingModal";
import { MeetingListItem } from "@/components/meetings/MeetingCard";
import { MeetingsHeader } from "@/components/meetings/MeetingsHeader";
import { MeetingsGrid } from "@/components/meetings/MeetingsGrid";
import { exportMeetingsZip } from "@/lib/meetings/meetingBatchExport";

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
  const [editingMeeting, setEditingMeeting] = useState<MeetingListItem | null>(null);
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

  const handleOpenCreateModal = () => {
    setEditingMeeting(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (meeting: MeetingListItem) => {
    setEditingMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleSaveMeeting = async (data: MeetingFormData) => {
    try {
      const isEdit = Boolean(data.id);
      const url = isEdit ? `/api/meetings/${data.id}` : "/api/meetings";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          scheduledAt: data.scheduledAt,
          location: data.location || null,
          objectives: data.objectives || null,
          status: data.status,
          attendeeIds: data.attendeeIds,
        }),
      });

      if (res.ok) {
        toast.success(isEdit ? "Réunion modifiée avec succès" : "Réunion créée avec succès");
        setIsModalOpen(false);
        setEditingMeeting(null);
        fetchMeetings();
      } else {
        const err = await res.json();
        toast.error(err.error || "Impossible d'enregistrer la réunion");
      }
    } catch (error) {
      console.error("Erreur enregistrement réunion:", error);
      toast.error("Erreur de connexion lors de l'enregistrement");
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
      const meetingsToExport = meetings.filter((m) => selectedMeetings.has(m.id));
      const { skippedCount } = await exportMeetingsZip(meetingsToExport, async (id) => {
        await fetch(`/api/meetings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isReportDownloaded: true }),
        });
      });

      if (skippedCount > 0) {
        toast.warning(`Archive ZIP créée. ${skippedCount} réunion(s) ignorée(s) car sans compte rendu.`);
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
      <MeetingsHeader
        selectedCount={selectedMeetings.size}
        isExporting={isExporting}
        onBatchExport={handleBatchExport}
        onOpenCreateModal={handleOpenCreateModal}
      />

      <MeetingsGrid
        meetings={meetings}
        selectedMeetings={selectedMeetings}
        onToggleSelect={toggleSelection}
        onEdit={handleOpenEditModal}
        currentUserName={session?.user?.name}
      />

      <MeetingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMeeting(null);
        }}
        onSubmit={handleSaveMeeting}
        users={users}
        initialData={
          editingMeeting
            ? {
                id: editingMeeting.id,
                title: editingMeeting.title,
                scheduledAt: editingMeeting.scheduledAt,
                location: editingMeeting.location,
                objectives: editingMeeting.objectives,
                status: editingMeeting.status as any,
                attendeeIds: editingMeeting.attendees.map((a) => a.user.id),
              }
            : null
        }
        mode={editingMeeting ? "edit" : "create"}
      />
    </div>
  );
}
