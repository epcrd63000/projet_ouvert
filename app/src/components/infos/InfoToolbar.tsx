"use client";

import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Upload, X } from "lucide-react";
import { InfoCategory, CATEGORY_LABELS } from "./infoTypes";

interface InfoToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: InfoCategory;
  onSelectCategory: (cat: InfoCategory) => void;
  categoryCounts: Record<string, number>;
  onOpenCreateModal: () => void;
  onImportFile: (file: File) => void;
}

const CATEGORIES: InfoCategory[] = [
  "ALL",
  "ORGANISATION",
  "CALENDRIER",
  "TECHNIQUE",
  "GENERAL",
];

/**
 * Barre d'outils et de navigation par onglets pour l'onglet Infos Importantes.
 * Permet le filtrage instantané, l'import direct de .md et la création de fiches.
 */
export function InfoToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  onOpenCreateModal,
  onImportFile,
}: InfoToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Barre de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, contenu, contact, mot-clé..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".md,.markdown,text/markdown,text/plain"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium"
            onClick={() => fileInputRef.current?.click()}
            title="Importer un fichier Markdown (.md)"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            Importer un .md
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium"
            onClick={onOpenCreateModal}
          >
            <Plus className="w-4 h-4" />
            Nouvelle fiche
          </Button>
        </div>
      </div>

      {/* Onglets thématiques de filtrage */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] || 0;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{CATEGORY_LABELS[cat] || cat}</span>
              <Badge
                variant={isActive ? "secondary" : "outline"}
                className={`text-[10px] px-1.5 py-0 h-4 border-0 ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/80 text-muted-foreground"
                }`}
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
