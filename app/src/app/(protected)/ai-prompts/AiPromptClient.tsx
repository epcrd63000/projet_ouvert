"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Copy, Check, Plus, X } from "lucide-react";

interface PromptItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string;
}

export function AiPromptClient({
  initialPrompts,
  userRole,
}: {
  initialPrompts: PromptItem[];
  userRole: "ADMIN" | "MEMBER";
}) {
  const [prompts, setPrompts] = useState<PromptItem[]>(initialPrompts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Formulaire d'ajout
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        const newPrompt = await res.json();
        setPrompts([newPrompt, ...prompts]);
        setIsModalOpen(false);
        setTitle("");
        setContent("");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création du prompt");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce prompt ?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setPrompts(prompts.filter((p) => p.id !== id));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {userRole === "ADMIN" && (
        <div className="flex justify-end">
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nouveau Prompt
          </Button>
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed">
          Aucun prompt disponible.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
                  {p.title}
                </CardTitle>
                {userRole === "ADMIN" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive shrink-0 ml-2"
                    onClick={() => handleDeletePrompt(p.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md h-32 overflow-y-auto whitespace-pre-wrap">
                  {p.content}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => handleCopy(p.content, p.id)}
                >
                  {copiedId === p.id ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" /> Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copier
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modale d'ajout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl border w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Créer un Modèle de Prompt</h2>
            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Générateur de tests unitaires"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="content">Contenu (Markdown) *</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                  placeholder="Écris le template de prompt ici..."
                  className="min-h-[200px] w-full rounded-md border p-2 text-sm bg-background"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  Créer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
