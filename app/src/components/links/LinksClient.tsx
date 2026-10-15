"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { ProjectLinkItem, LinkFormData } from "./linkTypes";
import { groupLinksByCategory, filterLinks } from "./linkUtils";
import { LinkToolbar } from "./LinkToolbar";
import { LinkCard } from "./LinkCard";
import { LinkModal } from "./LinkModal";
import { Link as LinkIcon } from "lucide-react";

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
    try {
      if (id) {
        const res = await fetch(`/api/links/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Erreur de mise à jour");
        const updated = await res.json();
        setLinks((prev) => prev.map((item) => (item.id === id ? updated : item)));
        toast.success("Lien mis à jour avec succès");
      } else {
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Erreur de création");
        const created = await res.json();
        setLinks((prev) => [created, ...prev]);
        toast.success("Nouveau lien ajouté");
      }
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce lien ?")) return;
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur de suppression");
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lien supprimé");
    } catch (err: any) {
      toast.error(err.message || "Erreur de suppression");
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
    </div>
  );
}
