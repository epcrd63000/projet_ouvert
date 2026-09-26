"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export interface MeetingFormData {
  title: string;
  scheduledAt: string;
  status: "PLANNED" | "IN_PROGRESS" | "DONE";
  attendeeIds: string[];
}

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingFormData) => void;
  users: { id: string; name: string }[];
}

export function MeetingModal({ isOpen, onClose, onSubmit, users }: MeetingModalProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState<"PLANNED" | "IN_PROGRESS" | "DONE">("PLANNED");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setScheduledAt("");
      setStatus("PLANNED");
      setAttendeeIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, scheduledAt, status, attendeeIds });
    onClose();
  };

  const toggleAttendee = (userId: string) => {
    setAttendeeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Nouvelle Réunion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Titre</label>
            <input
              type="text"
              required
              className="w-full rounded-md border p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Date et heure</label>
            <input
              type="datetime-local"
              required
              className="w-full rounded-md border p-2"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Participants</label>
            <div className="max-h-32 overflow-y-auto rounded-md border p-2 space-y-1">
              {users.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={attendeeIds.includes(user.id)}
                    onChange={() => toggleAttendee(user.id)}
                  />
                  {user.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
