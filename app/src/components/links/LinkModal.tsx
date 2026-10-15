"use client";

import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Globe, Loader2, Sparkles, Pin } from "lucide-react";
import { LinkFormData, ProjectLinkItem, DEFAULT_LINK_CATEGORIES } from "./linkTypes";
import { fetchGoogleFavicon, normalizeUrl } from "./linkUtils";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LinkFormData, id?: string) => Promise<void>;
  editingLink: ProjectLinkItem | null;
  existingCategories: string[];
}

/**
 * Boîte de dialogue modale pour la création ou la modification d'un lien utile.
 */
export function LinkModal({
  isOpen,
  onClose,
  onSave,
  editingLink,
  existingCategories,
}: LinkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Général");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronisation avec le lien sélectionné pour édition
  useEffect(() => {
    if (editingLink) {
      setTitle(editingLink.title);
      setUrl(editingLink.url);
      setCategory(editingLink.category || "Général");
      setIsCustomCategory(false);
      setCustomCategory("");
      setDescription(editingLink.description || "");
      setImageUrl(editingLink.imageUrl || "");
      setIsPinned(editingLink.isPinned || false);
    } else {
      setTitle("");
      setUrl("");
      setCategory("Général");
      setIsCustomCategory(false);
      setCustomCategory("");
      setDescription("");
      setImageUrl("");
      setIsPinned(false);
    }
  }, [editingLink, isOpen]);

  // Récupération automatique du favicon au blur du champ URL
  const handleUrlBlur = () => {
    if (url.trim() && !imageUrl.trim()) {
      const generated = fetchGoogleFavicon(url);
      setImageUrl(generated);
    }
  };

  const allCategories = Array.from(
    new Set([...DEFAULT_LINK_CATEGORIES, ...existingCategories])
  ).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedCategory = isCustomCategory
        ? customCategory.trim() || "Général"
        : category;

      const finalUrl = normalizeUrl(url);
      const finalImage = imageUrl.trim() || fetchGoogleFavicon(finalUrl);

      await onSave(
        {
          title: title.trim(),
          url: finalUrl,
          category: selectedCategory,
          description: description.trim() || undefined,
          imageUrl: finalImage,
          isPinned,
        },
        editingLink ? editingLink.id : undefined
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {editingLink ? "Modifier le lien" : "Ajouter un nouveau lien"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Titre du lien *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Min-imoca-26-27, GitHub, Trello..."
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">URL de destination *</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Catégorie</label>
            {isCustomCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Nom de la nouvelle catégorie..."
                  className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="px-3 py-2 text-xs font-medium rounded-xl bg-secondary text-secondary-foreground hover:bg-muted"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === "___NEW___") {
                    setIsCustomCategory(true);
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="___NEW___">+ Nouvelle catégorie personnalisée...</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Description optionnelle</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Courte note ou rappel sur la ressource..."
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Icône / Favicon (automatique ou personnalisée)</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="preview" className="w-full h-full object-contain" />
                ) : (
                  <Globe className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL du logo/favicon..."
                className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPinnedCheck"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-primary border-input focus:ring-primary"
            />
            <label htmlFor="isPinnedCheck" className="text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              Épingler ce lien en tête de liste
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted text-muted-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !url.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingLink ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
