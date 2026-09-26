"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
}

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  attendees: { user: User }[];
  createdBy: User;
}

export default function MeetingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setNotes(data.notes || "");
      } else {
        router.push("/meetings");
      }
    } catch (error) {
      console.error("Erreur chargement réunion:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  const handleSaveNotes = async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        fetchMeeting();
        alert("Compte rendu enregistré avec succès.");
      }
    } catch (error) {
      console.error("Erreur sauvegarde notes:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cette réunion ?")) return;
    try {
      const res = await fetch(`/api/meetings/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/meetings");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!meeting) {
    return null; // ou erreur
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <Button variant="ghost" onClick={() => router.push("/meetings")} className="mb-2">
            ← Retour aux réunions
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
          <p className="text-muted-foreground mt-1">
            Prévue le : {new Date(meeting.scheduledAt).toLocaleString("fr-FR")}
          </p>
        </div>
        {isAdmin && (
          <Button variant="destructive" onClick={handleDelete}>
            Supprimer la réunion
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 mb-2">Informations</h3>
            <p className="text-sm"><strong>Statut :</strong> {meeting.status}</p>
            <p className="text-sm"><strong>Créée par :</strong> {meeting.createdBy?.name}</p>
          </div>
          
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 mb-2">Participants ({meeting.attendees.length})</h3>
            <ul className="text-sm space-y-1">
              {meeting.attendees.map((a) => (
                <li key={a.user.id}>• {a.user.name}</li>
              ))}
              {meeting.attendees.length === 0 && <li className="text-muted-foreground">Aucun</li>}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 mb-2">Compte Rendu</h3>
            <textarea
              className="w-full min-h-[300px] p-3 rounded-md border text-sm"
              placeholder="Saisissez le compte rendu de la réunion ici..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveNotes}>Enregistrer le compte rendu</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
