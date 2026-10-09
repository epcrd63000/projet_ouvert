"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatToDateTimeLocal, parseDateTimeLocalToIso } from "@/lib/meetings/meetingEditService";
import { MeetingModalFields } from "./MeetingModalFields";
import { MeetingModalAttendeesList } from "./MeetingModalAttendeesList";

export interface MeetingFormData {
  id?: string;
  title: string;
  scheduledAt: string;
  location?: string | null;
  objectives?: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "DONE";
  attendeeIds: string[];
}

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingFormData) => Promise<void> | void;
  users: { id: string; name: string }[];
  initialData?: Partial<MeetingFormData> | null;
  mode?: "create" | "edit";
}

export function MeetingModal({
  isOpen,
  onClose,
  onSubmit,
  users,
  initialData,
  mode = "create",
}: MeetingModalProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [objectives, setObjectives] = useState("");
  const [status, setStatus] = useState<"PLANNED" | "IN_PROGRESS" | "DONE">("PLANNED");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = mode === "edit" || Boolean(initialData?.id);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || "");
        setScheduledAt(formatToDateTimeLocal(initialData.scheduledAt));
        setLocation(initialData.location || "");
        setObjectives(initialData.objectives || "");
        setStatus(initialData.status || "PLANNED");
        setAttendeeIds(initialData.attendeeIds || []);
      } else {
        setTitle("");
        setScheduledAt("");
        setLocation("");
        setObjectives("");
        setStatus("PLANNED");
        setAttendeeIds([]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isoDate = parseDateTimeLocalToIso(scheduledAt);
      await onSubmit({
        id: initialData?.id,
        title,
        scheduledAt: isoDate,
        location,
        objectives,
        status,
        attendeeIds,
      });
      onClose();
    } catch (error) {
      console.error("Erreur soumission réunion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAttendee = (userId: string) => {
    setAttendeeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAllAttendees = () => {
    if (attendeeIds.length === users.length) {
      setAttendeeIds([]);
    } else {
      setAttendeeIds(users.map((u) => u.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl border">
        <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
          {isEditMode ? "Modifier la réunion" : "Nouvelle réunion"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MeetingModalFields
            title={title}
            onTitleChange={setTitle}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            status={status}
            onStatusChange={setStatus}
            location={location}
            onLocationChange={setLocation}
            objectives={objectives}
            onObjectivesChange={setObjectives}
          />

          <MeetingModalAttendeesList
            users={users}
            selectedAttendeeIds={attendeeIds}
            onToggleAttendee={toggleAttendee}
            onToggleAll={toggleAllAttendees}
          />

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting
                ? "Enregistrement..."
                : isEditMode
                ? "Enregistrer les modifications"
                : "Créer la réunion"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
