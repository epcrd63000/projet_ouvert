"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Copy, Check, Plus, X, Pencil } from "lucide-react";
import { toast } from "sonner";

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
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const openCreateModal = () => {
    setEditingPrompt(null);
    setTitle("");
    setContent("");
    setIsModalOpen(true);
  };

  const openEditModal = (prompt: PromptItem) => {
    setEditingPrompt(prompt);
    setTitle(prompt.title);
    setContent(prompt.content);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPrompt) {
        // Mise à jour d'un prompt existant
        const res = await fetch(`/api/prompts/${editingPrompt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });

        if (res.ok) {
          const updated = await res.json();
          setPrompts(prompts.map((p) => (p.id === updated.id ? updated : p)));
          setIsModalOpen(false);
          toast.success("Prompt mis à jour avec succès !");
        } else {
          toast.error("Erreur lors de la mise à jour");
        }
      } else {
        // Création d'un nouveau prompt
        const res = await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });

        if (res.ok) {
          const newPrompt = await res.json();
          setPrompts([newPrompt, ...prompts]);
          setIsModalOpen(false);
          toast.success("Prompt créé avec succès !");
        } else {
          toast.error("Erreur lors de la création");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau");
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
        toast.success("Prompt supprimé");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Prompt copié dans le presse-papier !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Modèles de prompts partagés pour structurer les comptes rendus et cadrer les échanges avec l&apos;IA.
        </p>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau Prompt
        </Button>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed">
          Aucun prompt disponible.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between shadow-sm hover:shadow transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  {p.title}
                </CardTitle>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => openEditModal(p)}
                    title="Modifier ce prompt"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {userRole === "ADMIN" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeletePrompt(p.id)}
                      disabled={loading}
                      title="Supprimer ce prompt"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md h-36 overflow-y-auto whitespace-pre-wrap font-mono">
                  {p.content}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="secondary" className="w-full gap-2 text-xs" onClick={() => handleCopy(p.content, p.id)}>
                  {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === p.id ? "Copié !" : "Copier le Prompt"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modale d'ajout ou modification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl border w-full max-w-lg p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">
              {editingPrompt ? "Modifier le Modèle de Prompt" : "Créer un Modèle de Prompt"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Titre du prompt *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="content">Contenu du prompt *</Label>
                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[220px] text-xs font-mono" required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={loading}>{editingPrompt ? "Enregistrer" : "Créer"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
