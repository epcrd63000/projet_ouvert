"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ImportantInfo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface InfoClientProps {
  initialInfos: ImportantInfo[];
  isAdmin: boolean;
}

export function InfoClient({ initialInfos, isAdmin }: InfoClientProps) {
  const [infos, setInfos] = useState<ImportantInfo[]>(initialInfos);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const res = await fetch(`/api/infos/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInfos(infos.map(i => i.id === editingId ? { ...updated, createdAt: new Date(updated.createdAt) } : i));
        setEditingId(null);
        setTitle("");
        setContent("");
      }
    } else {
      const res = await fetch("/api/infos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const created = await res.json();
        setInfos([{ ...created, createdAt: new Date(created.createdAt) }, ...infos]);
        setTitle("");
        setContent("");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette info ?")) return;
    const res = await fetch(`/api/infos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInfos(infos.filter(i => i.id !== id));
    }
  };

  const handleEdit = (info: ImportantInfo) => {
    setEditingId(info.id);
    setTitle(info.title);
    setContent(info.content);
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Modifier l'info" : "Nouvelle Info"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Titre de l'info"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Contenu..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Enregistrer" : "Créer"}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => { setEditingId(null); setTitle(""); setContent(""); }}>
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {infos.map((info) => (
          <Card key={info.id}>
            <CardHeader>
              <CardTitle className="text-xl">{info.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Le {format(new Date(info.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
              </p>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{info.content}</p>
            </CardContent>
            {isAdmin && (
              <CardFooter className="gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(info)}>Modifier</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(info.id)}>Supprimer</Button>
              </CardFooter>
            )}
          </Card>
        ))}
        {infos.length === 0 && (
          <p className="text-muted-foreground">Aucune info importante à afficher.</p>
        )}
      </div>
    </div>
  );
}
