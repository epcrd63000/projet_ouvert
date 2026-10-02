"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MeetingModal, MeetingFormData } from "@/components/meetings/MeetingModal";
import { Users as UsersIcon, Plus, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  attendees: { user: User }[];
}

export default function MeetingsPage() {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        fetchMeetings();
      }
    } catch (error) {
      console.error("Erreur création réunion:", error);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Réunions</h1>
            <p className="text-muted-foreground">Planification et comptes rendus</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nouvelle réunion
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-10">Aucune réunion prévue.</p>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1" title={meeting.title}>{meeting.title}</h3>
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
