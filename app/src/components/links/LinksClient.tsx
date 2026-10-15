"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { ProjectLinkItem, LinkFormData } from "./linkTypes";
import { groupLinksByCategory, filterLinks } from "./linkUtils";
import { LinkToolbar } from "./LinkToolbar";
import { LinkCard } from "./LinkCard";
import { LinkModal } from "./LinkModal";
import { Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

async function getResponseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as
    | { error?: unknown }
    | null;
  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error;
  }
  return `${fallback} (HTTP ${response.status})`;
}

interface LinksClientProps {
  initialLinks: ProjectLinkItem[];
  isAdmin: boolean;
}

/**
 * Composant client principal gérant l'état, l'affichage et les interactions de la page Liens Utiles.
 */
export function LinksClient({ initialLinks }: LinksClientProps) {
  const [links, setLinks] = useState<ProjectLinkItem[]>(initialLinks);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectLinkItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectLinkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    links.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set).sort();
  }, [links]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: links.length };
    links.forEach((l) => {
      const c = l.category || "Général";
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [links]);

  const filteredLinks = useMemo(() => {
    return filterLinks(links, searchQuery, selectedCategory);
  }, [links, searchQuery, selectedCategory]);

  const grouped = useMemo(() => {
    return groupLinksByCategory(filteredLinks);
  }, [filteredLinks]);

  const handleSave = async (data: LinkFormData, id?: string) => {
    const isEditing = !!id;
    const res = await fetch(isEditing ? `/api/links/${id}` : "/api/links", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(
        await getResponseError(
          res,
          isEditing ? "Erreur lors de la mise à jour du lien" : "Erreur lors de la création du lien"
        )
      );
    }
    const savedLink: ProjectLinkItem = await res.json();
    if (isEditing) {
      setLinks((prev) => prev.map((item) => (item.id === id ? savedLink : item)));
      toast.success("Lien mis à jour avec succès");
    } else {
      setLinks((prev) => [savedLink, ...prev]);
      toast.success("Nouveau lien ajouté");
    }
  };

  const handleDelete = (id: string) => {
    const link = links.find((item) => item.id === id);
    if (link) setPendingDelete(link);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/links/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await getResponseError(res, "Erreur lors de la suppression du lien"));
      }
      setLinks((prev) => prev.filter((link) => link.id !== pendingDelete.id));
      toast.success("Lien supprimé");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression du lien");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async (link: ProjectLinkItem) => {
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !link.isPinned }),
      });
      if (!res.ok) throw new Error("Erreur de mise à jour");
      const updated = await res.json();
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
      toast.success(updated.isPinned ? "Lien épinglé en tête" : "Lien détaché");
    } catch (err: any) {
      toast.error(err.message || "Erreur de mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      <LinkToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
        categoryCounts={categoryCounts}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenAddModal={() => {
          setEditingLink(null);
          setIsModalOpen(true);
        }}
      />

      {filteredLinks.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-8">
          <LinkIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">Aucun lien ne correspond à votre recherche.</p>
          <button
            onClick={() => {
              setEditingLink(null);
              setIsModalOpen(true);
            }}
            className="mt-4 text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            + Ajouter un premier lien
          </button>
        </div>
      ) : selectedCategory === "ALL" && !searchQuery ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([categoryName, items]) => (
            <div key={categoryName} className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm tracking-wide uppercase">
                  {categoryName}
                </h3>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {items.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    isEditMode={isEditMode}
                    onEdit={(l) => {
                      setEditingLink(l);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              isEditMode={isEditMode}
              onEdit={(l) => {
                setEditingLink(l);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}

      <LinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingLink={editingLink}
        existingCategories={categories}
      />

      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader className="pr-8">
            <DialogTitle>Supprimer ce lien ?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `« ${pendingDelete.title} » sera supprimé définitivement de la liste.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
