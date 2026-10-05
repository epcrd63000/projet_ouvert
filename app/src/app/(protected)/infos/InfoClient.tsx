"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { ImportantInfoItem, InfoCategory, InfoFormData } from "@/components/infos/infoTypes";
import { InfoToolbar } from "@/components/infos/InfoToolbar";
import { InfoCard } from "@/components/infos/InfoCard";
import { InfoEditorModal } from "@/components/infos/InfoEditorModal";
import { parseImportedMarkdown } from "@/components/infos/infoExportUtils";
import { BookOpen } from "lucide-react";

interface InfoClientProps {
  initialInfos: ImportantInfoItem[];
  isAdmin: boolean;
}

export function InfoClient({ initialInfos }: InfoClientProps) {
  const [infos, setInfos] = useState<ImportantInfoItem[]>(initialInfos);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<InfoCategory>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState<ImportantInfoItem | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: infos.length };
    infos.forEach((info) => {
      counts[info.category] = (counts[info.category] || 0) + 1;
    });
    return counts;
  }, [infos]);

  const filteredInfos = useMemo(() => {
    return infos.filter((info) => {
      const matchesCategory = selectedCategory === "ALL" || info.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        info.title.toLowerCase().includes(q) ||
        info.content.toLowerCase().includes(q) ||
        (info.interlocutors && info.interlocutors.toLowerCase().includes(q))
      );
    });
  }, [infos, selectedCategory, searchQuery]);

  const handleSave = async (data: InfoFormData, id?: string) => {
    try {
      if (id) {
        const res = await fetch(`/api/infos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Échec de la mise à jour");
        const updated = await res.json();
        setInfos((prev) => prev.map((item) => (item.id === id ? updated : item)));
        toast.success("Fiche mise à jour avec succès");
      } else {
        const res = await fetch("/api/infos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Échec de la création");
        const created = await res.json();
        setInfos((prev) => [created, ...prev]);
        toast.success("Nouvelle fiche d'information créée");
      }
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette fiche ?")) return;
    try {
      const res = await fetch(`/api/infos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Échec de la suppression");
      setInfos((prev) => prev.filter((i) => i.id !== id));
      toast.success("Fiche supprimée");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  const handleTogglePin = async (info: ImportantInfoItem) => {
    try {
      const res = await fetch(`/api/infos/${info.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !info.isPinned }),
      });
      if (!res.ok) throw new Error("Échec du changement d'épinglage");
      const updated = await res.json();
      setInfos((prev) => {
        const next = prev.map((i) => (i.id === info.id ? updated : i));
        return next.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
      toast.success(updated.isPinned ? "Fiche épinglée en tête" : "Fiche détachée");
    } catch (err: any) {
      toast.error(err.message || "Erreur de mise à jour");
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseImportedMarkdown(text, file.name);
        setEditingInfo({
          id: "",
          title: parsed.title || file.name,
          content: parsed.content || "",
          category: parsed.category || "GENERAL",
          eventDate: parsed.eventDate || null,
          interlocutors: parsed.interlocutors || null,
          isPinned: false,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setIsModalOpen(true);
        toast.info(`Fichier ${file.name} chargé dans l'éditeur`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <InfoToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
        onOpenCreateModal={() => {
          setEditingInfo(null);
          setIsModalOpen(true);
        }}
        onImportFile={handleImportFile}
      />

      <div className="space-y-4">
        {filteredInfos.map((info) => (
          <InfoCard
            key={info.id}
            info={info}
            onEdit={(item) => {
              setEditingInfo(item);
              setIsModalOpen(true);
            }}
            onDelete={handleDelete}
            onTogglePin={handleTogglePin}
          />
        ))}

        {filteredInfos.length === 0 && (
          <div className="text-center py-16 px-4 border border-dashed rounded-lg bg-card/50">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
            <h3 className="text-base font-semibold text-foreground">Aucune fiche trouvée</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Aucun document ne correspond à vos filtres. Créez une nouvelle fiche ou importez un fichier Markdown (.md).
            </p>
          </div>
        )}
      </div>

      <InfoEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInfo(null);
        }}
        onSave={handleSave}
        initialData={editingInfo}
      />
    </div>
  );
}
