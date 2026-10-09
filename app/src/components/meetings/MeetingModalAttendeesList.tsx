"use client";

import React from "react";
import { Users } from "lucide-react";

interface UserOption {
  id: string;
  name: string;
}

interface MeetingModalAttendeesListProps {
  users: UserOption[];
  selectedAttendeeIds: string[];
  onToggleAttendee: (userId: string) => void;
  onToggleAll: () => void;
}

export function MeetingModalAttendeesList({
  users,
  selectedAttendeeIds,
  onToggleAttendee,
  onToggleAll,
}: MeetingModalAttendeesListProps) {
  const allSelected = selectedAttendeeIds.length === users.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" /> Participants ({selectedAttendeeIds.length}/{users.length})
        </label>
        <button
          type="button"
          onClick={onToggleAll}
          className="text-xs text-primary hover:underline"
        >
          {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
      </div>
      <div className="max-h-28 overflow-y-auto rounded-md border p-2 space-y-1 bg-muted/20">
        {users.map((user) => (
          <label
            key={user.id}
            className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/40 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={selectedAttendeeIds.includes(user.id)}
              onChange={() => onToggleAttendee(user.id)}
            />
            <span>{user.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
