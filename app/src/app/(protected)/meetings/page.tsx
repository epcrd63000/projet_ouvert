"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MeetingModal, MeetingFormData } from "@/components/meetings/MeetingModal";
import { Users as UsersIcon, Plus } from "lucide-react";

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
      const res = await fetch("/api/meetings");
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
          <p className="text-muted-foreground">Aucune réunion prévue.</p>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="rounded-lg border bg-card p-4 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg">{meeting.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(meeting.scheduledAt).toLocaleString("fr-FR")}
                </p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Statut:</span> {meeting.status}
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Participants:</span>{" "}
                  {meeting.attendees.map((a) => a.user.name).join(", ") || "Aucun"}
                </div>
              </div>
              <div className="mt-4">
                <Link href={`/meetings/${meeting.id}`}>
                  <Button variant="secondary" className="w-full">Voir / Ajouter un compte rendu</Button>
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
