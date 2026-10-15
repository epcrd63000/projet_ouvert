"use client";

import React from "react";
import { Search, Plus, Edit2, Check, Sparkles } from "lucide-react";

interface LinkToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenAddModal: () => void;
}

/**
 * Barre d'outils pour la recherche, le filtrage par catégorie et les actions d'édition/ajout de liens.
 */
export function LinkToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  categoryCounts,
  isEditMode,
  onToggleEditMode,
  onOpenAddModal,
}: LinkToolbarProps) {
  return (
    <div className="space-y-4">
      {/* Ligne d'actions supérieures */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un lien, un tag ou une ressource..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 shadow-xs"
          />
        </div>

        {/* Boutons d'édition et d'ajout */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleEditMode}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border shadow-xs ${
              isEditMode
                ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                : "bg-card border-border hover:bg-muted text-foreground"
            }`}
          >
            {isEditMode ? <Check className="w-4 h-4 text-amber-500" /> : <Edit2 className="w-4 h-4 text-muted-foreground" />}
            <span>{isEditMode ? "Terminer" : "Gérer les liens"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau lien</span>
          </button>
        </div>
      </div>

      {/* Filtres par catégories (pilules horizontales scrollables) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectCategory("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            selectedCategory === "ALL"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>Tous</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-semibold">
            {categoryCounts["ALL"] || 0}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{cat}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-semibold">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
