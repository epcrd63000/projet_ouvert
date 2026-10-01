"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format, differenceInDays, min, max, addDays } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { BarChart3, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  color: string;
}

interface AppEvent {
  id: string;
  title: string;
  start: string;
  type: "meeting" | "task";
}

export default function GanttPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Formulaire nouveau jalon
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");

  const [selectedItem, setSelectedItem] = useState<{
    id?: string;
    type: "milestone" | "task";
    title: string;
    description?: string;
    start: string;
    end?: string;
    status?: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [resMilestones, resEvents] = await Promise.all([
        fetch("/api/milestones"),
        fetch("/api/events"),
      ]);

      if (resMilestones.ok && resEvents.ok) {
        setMilestones(await resMilestones.json());
        setEvents(await resEvents.json());
      }
    } catch (error) {
      console.error("Erreur chargement Gantt:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc || undefined,
          startDate: new Date(newStart).toISOString(),
          endDate: new Date(newEnd).toISOString(),
          color: newColor,
          status: "UPCOMING",
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setNewName("");
        setNewDesc("");
        setNewStart("");
        setNewEnd("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création du jalon");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce jalon ?")) return;
    try {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedItem(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur de suppression");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSelectedItem((prev) => (prev ? { ...prev, status: newStatus } : null));
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  const allDates: Date[] = [];
  milestones.forEach((m) => {
    allDates.push(new Date(m.startDate), new Date(m.endDate));
  });
  events.forEach((e) => {
    allDates.push(new Date(e.start));
  });

  const minDate = allDates.length > 0 ? min(allDates) : new Date();
  const maxDate = allDates.length > 0 ? addDays(max(allDates), 7) : addDays(new Date(), 30);
  const totalDays = Math.max(1, differenceInDays(maxDate, minDate));

  const tasks = events.filter((e) => e.type === "task");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diagramme de Gantt</h1>
            <p className="text-muted-foreground">Jalons du projet et échéances des tâches</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau jalon
        </Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-4 overflow-hidden flex flex-col">
        <div className="flex border-b pb-2 mb-4">
          <div className="w-[200px] shrink-0 font-semibold text-sm flex items-end">
            Jalons
          </div>
          <div className="flex-1 relative h-8 overflow-hidden">
            <div className="absolute left-0 bottom-0 text-xs text-muted-foreground font-medium">
              {format(minDate, "dd MMM yyyy", { locale: fr })}
            </div>
            <div className="absolute right-0 bottom-0 text-xs text-muted-foreground font-medium">
              {format(maxDate, "dd MMM yyyy", { locale: fr })}
            </div>
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 border-l border-border/50 border-dashed"
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {milestones.length === 0 && (
            <p className="text-sm text-muted-foreground pl-[200px]">Aucun jalon.</p>
          )}
          {milestones.map((m) => {
            const startOffset = Math.max(0, differenceInDays(new Date(m.startDate), minDate));
            const duration = Math.max(1, differenceInDays(new Date(m.endDate), new Date(m.startDate)));
            const leftPercent = (startOffset / totalDays) * 100;
            const widthPercent = (duration / totalDays) * 100;

            return (
              <div key={m.id} className="flex group items-center">
                <div className="w-[200px] shrink-0 text-sm pr-4 truncate" title={m.name}>
                  {m.name}
                </div>
                <div className="flex-1 relative h-8 bg-muted/20 rounded">
                  {[25, 50, 75].map((pct) => (
                    <div
                      key={pct}
                      className="absolute top-0 bottom-0 border-l border-border/30 border-dashed"
                      style={{ left: `${pct}%` }}
                    />
                  ))}
                  <div
                    onClick={() =>
                      setSelectedItem({
                        id: m.id,
                        type: "milestone",
                        title: m.name,
                        description: m.description || "Aucune description",
                        start: m.startDate,
                        end: m.endDate,
                        status: m.status,
                      })
                    }
                    className="absolute h-full rounded flex items-center px-2 text-xs text-white font-medium cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-md"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(widthPercent, 1)}%`,
                      backgroundColor: m.color || "#6366f1",
                      minWidth: "12px",
                    }}
                    title={`${m.name} (${format(new Date(m.startDate), "dd/MM")} - ${format(
                      new Date(m.endDate),
                      "dd/MM"
                    )})`}
                  >
                    <span className="truncate w-full drop-shadow-sm opacity-0 md:opacity-100">
                      {m.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="border-t pt-4 mt-6">
            <h3 className="font-semibold text-sm mb-4">Échéances des tâches</h3>
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune tâche avec date d&apos;échéance.</p>
            )}
            {tasks.map((t) => {
              const startOffset = Math.max(0, differenceInDays(new Date(t.start), minDate));
              const leftPercent = (startOffset / totalDays) * 100;

              return (
                <div key={t.id} className="flex group items-center mb-2">
                  <div
                    className="w-[200px] shrink-0 text-sm pr-4 truncate text-muted-foreground"
                    title={t.title}
                  >
                    {t.title}
                  </div>
                  <div className="flex-1 relative h-6 bg-muted/20 rounded">
                    {[25, 50, 75].map((pct) => (
                      <div
                        key={pct}
                        className="absolute top-0 bottom-0 border-l border-border/30 border-dashed"
                        style={{ left: `${pct}%` }}
                      />
                    ))}
                    <div
                      onClick={() =>
                        setSelectedItem({
                          type: "task",
                          title: t.title,
                          start: t.start,
                        })
                      }
                      className="absolute h-4 w-4 rounded-full bg-indigo-500 shadow-sm cursor-pointer hover:scale-125 transition-transform top-1"
                      style={{ left: `calc(${leftPercent}% - 8px)` }}
                      title={`${t.title} (${format(new Date(t.start), "dd/MM")})`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modale détails d'un jalon ou tâche */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl border w-full max-w-md overflow-hidden relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="text-xs uppercase font-semibold text-muted-foreground mb-1 tracking-wider">
                {selectedItem.type === "milestone" ? "Détails du jalon" : "Détails de la tâche"}
              </div>
              <h2 className="text-xl font-bold mb-4 pr-6 leading-tight">{selectedItem.title}</h2>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-muted-foreground font-medium">Début:</span>
                  <span>{format(new Date(selectedItem.start), "dd MMMM yyyy", { locale: fr })}</span>
                </div>

                {selectedItem.end && (
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground font-medium">Fin:</span>
                    <span>{format(new Date(selectedItem.end), "dd MMMM yyyy", { locale: fr })}</span>
                  </div>
                )}

                {selectedItem.status && (
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <span className="text-muted-foreground font-medium">Statut:</span>
                    {selectedItem.id ? (
                      <select
                        value={selectedItem.status}
                        onChange={(e) => handleStatusChange(selectedItem.id!, e.target.value)}
                        className="p-1 rounded bg-background border text-xs"
                      >
                        <option value="UPCOMING">À venir (UPCOMING)</option>
                        <option value="IN_PROGRESS">En cours (IN_PROGRESS)</option>
                        <option value="ACHIEVED">Atteint (ACHIEVED)</option>
                        <option value="MISSED">Manqué (MISSED)</option>
                      </select>
                    ) : (
                      <span>{selectedItem.status}</span>
                    )}
                  </div>
                )}

                {selectedItem.description && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="block text-muted-foreground font-medium mb-1">Description:</span>
                    <p className="whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted p-4 flex justify-between items-center">
              {selectedItem.type === "milestone" && selectedItem.id && isAdmin ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteMilestone(selectedItem.id!)}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" /> Supprimer
                </Button>
              ) : (
                <div />
              )}
              <Button onClick={() => setSelectedItem(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modale création nouveau jalon */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl border w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Nouveau Jalon Gantt</h2>
            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="m-name">Nom du jalon *</Label>
                <Input
                  id="m-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Soutenance intermédiaire"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="m-start">Date de début *</Label>
                  <Input
                    id="m-start"
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-end">Date de fin *</Label>
                  <Input
                    id="m-end"
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="m-color">Couleur</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="m-color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer p-0.5"
                  />
                  <span className="text-sm font-mono text-muted-foreground">{newColor}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="m-desc">Description</Label>
                <textarea
                  id="m-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="flex w-full rounded-md border bg-background px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Objectifs, livrables attendus..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer le jalon</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
