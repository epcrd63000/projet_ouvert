"use client";

import React, { useState, useEffect } from "react";
import { Globe, Loader2, Sparkles, Pin } from "lucide-react";
import { LinkFormData, ProjectLinkItem, DEFAULT_LINK_CATEGORIES } from "./linkTypes";
import { fetchGoogleFavicon, normalizeUrl } from "./linkUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [submitError, setSubmitError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [urlError, setUrlError] = useState("");

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

  useEffect(() => {
    if (isOpen) {
      setSubmitError("");
      setTitleError("");
      setUrlError("");
    }
  }, [isOpen]);

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
    setSubmitError("");
    setTitleError("");
    setUrlError("");
    if (!title.trim()) setTitleError("Le titre est requis.");
    if (!url.trim()) setUrlError("L’URL de destination est requise.");
    if (!title.trim() || !url.trim()) return;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizeUrl(url));
    } catch {
      setUrlError("Saisissez une URL valide, par exemple https://exemple.fr.");
      return;
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      setUrlError("L’URL doit commencer par http:// ou https://.");
      return;
    }

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
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l’enregistrement du lien."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border-border bg-card p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold text-foreground">
            <Sparkles className="w-5 h-5 text-primary" />
            {editingLink ? "Modifier le lien" : "Ajouter un nouveau lien"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {submitError}
            </div>
          )}
          <div>
            <label htmlFor="link-title" className="mb-1.5 block text-xs font-medium text-foreground">Titre du lien *</label>
            <input
              id="link-title"
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Min-imoca-26-27, GitHub, Trello..."
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "link-title-error" : undefined}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
            {titleError && <p id="link-title-error" className="mt-1.5 text-xs text-destructive">{titleError}</p>}
          </div>

          <div>
            <label htmlFor="link-url" className="mb-1.5 block text-xs font-medium text-foreground">URL de destination *</label>
            <input
              id="link-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError("");
              }}
              onBlur={handleUrlBlur}
              placeholder="https://..."
              aria-invalid={!!urlError}
              aria-describedby={urlError ? "link-url-error" : undefined}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
            {urlError && <p id="link-url-error" className="mt-1.5 text-xs text-destructive">{urlError}</p>}
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
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
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
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
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
            <label htmlFor="link-description" className="mb-1.5 block text-xs font-medium text-foreground">Description optionnelle</label>
            <input
              id="link-description"
              type="text"
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Courte note ou rappel sur la ressource..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
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
                aria-label="URL de l’icône ou du favicon"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL du logo/favicon..."
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
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

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
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
      </DialogContent>
    </Dialog>
  );
}
