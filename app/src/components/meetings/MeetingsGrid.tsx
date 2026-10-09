"use client";

import React from "react";
import { MeetingCard, MeetingListItem } from "./MeetingCard";

interface MeetingsGridProps {
  meetings: MeetingListItem[];
  selectedMeetings: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (meeting: MeetingListItem) => void;
  currentUserName?: string | null;
}

export function MeetingsGrid({
  meetings,
  selectedMeetings,
  onToggleSelect,
  onEdit,
  currentUserName,
}: MeetingsGridProps) {
  if (meetings.length === 0) {
    return (
      <p className="text-muted-foreground col-span-full text-center py-10">
        Aucune réunion prévue.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          isSelected={selectedMeetings.has(meeting.id)}
          onToggleSelect={onToggleSelect}
          onEdit={onEdit}
          currentUserName={currentUserName}
        />
      ))}
    </div>
  );
}
