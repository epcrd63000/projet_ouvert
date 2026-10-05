"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, UserX, Clock, Users } from "lucide-react";
import { toast } from "sonner";

export type AttendanceStatus = "PRESENT" | "EXCUSED" | "ABSENT";

export interface AttendeeItem {
  id: string;
  status: AttendanceStatus;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface MeetingAttendanceCardProps {
  meetingId: string;
  attendees: AttendeeItem[];
  onAttendanceChange: (attendeeId: string, status: AttendanceStatus) => Promise<void>;
}

export function MeetingAttendanceCard({
  meetingId,
  attendees,
  onAttendanceChange,
}: MeetingAttendanceCardProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const presentCount = attendees.filter((a) => a.status === "PRESENT").length;
  const excusedCount = attendees.filter((a) => a.status === "EXCUSED").length;
  const absentCount = attendees.filter((a) => a.status === "ABSENT").length;

  const handleStatusClick = async (attendeeId: string, newStatus: AttendanceStatus) => {
    try {
      setUpdatingId(attendeeId);
      await onAttendanceChange(attendeeId, newStatus);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour de l'émargement");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Émargement ({attendees.length})
          </CardTitle>
          <div className="flex gap-1 text-xs">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
              {presentCount} Présent{presentCount > 1 ? "s" : ""}
            </Badge>
            {excusedCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                {excusedCount} Excusé{excusedCount > 1 ? "s" : ""}
              </Badge>
            )}
            {absentCount > 0 && (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-200">
                {absentCount} Absent{absentCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-2">
        {attendees.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Aucun participant invité.</p>
        ) : (
          attendees.map((attendee) => {
            const isUpdating = updatingId === attendee.id;
            return (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/40 transition-colors text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs">
                    {attendee.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium truncate text-xs sm:text-sm">
                    {attendee.user.name}
                  </span>
                </div>

                {/* Sélecteur d'émargement en 3 boutons rapides */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={attendee.status === "PRESENT" ? "default" : "outline"}
                    className={`h-7 px-2 text-xs ${
                      attendee.status === "PRESENT"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "text-muted-foreground"
                    }`}
                    disabled={isUpdating}
                    onClick={() => handleStatusClick(attendee.id, "PRESENT")}
                    title="Marquer présent"
                  >
                    <Check className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Présent</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant={attendee.status === "EXCUSED" ? "default" : "outline"}
                    className={`h-7 px-2 text-xs ${
                      attendee.status === "EXCUSED"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "text-muted-foreground"
                    }`}
                    disabled={isUpdating}
                    onClick={() => handleStatusClick(attendee.id, "EXCUSED")}
                    title="Marquer excusé"
                  >
                    <Clock className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Excusé</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant={attendee.status === "ABSENT" ? "default" : "outline"}
                    className={`h-7 px-2 text-xs ${
                      attendee.status === "ABSENT"
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "text-muted-foreground"
                    }`}
                    disabled={isUpdating}
                    onClick={() => handleStatusClick(attendee.id, "ABSENT")}
                    title="Marquer absent"
                  >
                    <UserX className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Absent</span>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
