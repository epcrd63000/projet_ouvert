"use client";

import React, { useState } from "react";
import { ExternalLink, Edit2, Trash2, Pin, Copy, Check, Globe } from "lucide-react";
import { ProjectLinkItem } from "./linkTypes";
import { toast } from "sonner";

interface LinkCardProps {
  link: ProjectLinkItem;
  isEditMode: boolean;
  onEdit: (link: ProjectLinkItem) => void;
  onDelete: (id: string) => void;
  onTogglePin?: (link: ProjectLinkItem) => void;
}

/**
 * Carte interactive représentant un lien utile avec aperçu du favicon, titre, catégorie et actions.
 */
export function LinkCard({
  link,
  isEditMode,
  onEdit,
  onDelete,
  onTogglePin,
}: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    toast.success("Lien copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      onEdit(link);
    }
  };

  return (
    <div className="relative group">
      <a
        href={isEditMode ? "#" : link.url}
        target={isEditMode ? "_self" : "_blank"}
        rel="noopener noreferrer"
        onClick={handleCardClick}
        className={`flex flex-col items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all duration-200 text-center h-full min-h-[170px] ${
          isEditMode
            ? "cursor-pointer hover:border-primary/50 hover:bg-muted/40"
            : "hover:-translate-y-1 hover:border-primary/40 dark:hover:border-primary/40"
        } ${link.isPinned ? "ring-1 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-500/5" : ""}`}
      >
        {/* En-tête de carte avec icône de pin si épinglé */}
        <div className="w-full flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground truncate max-w-[120px]">
            {link.category}
          </span>
          {link.isPinned && (
            <span
              title="Lien épinglé"
              className="inline-flex items-center text-amber-500 text-xs font-semibold"
            >
              <Pin className="w-3.5 h-3.5 fill-amber-500 rotate-45" />
            </span>
          )}
        </div>

        {/* Aperçu du favicon / image */}
        <div className="w-14 h-14 rounded-xl bg-background border border-border/80 flex items-center justify-center p-2 mb-3 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
          {link.imageUrl && !imageError ? (
            <img
              src={link.imageUrl}
              alt={link.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <Globe className="w-7 h-7 text-muted-foreground/60" />
          )}
        </div>

        {/* Titre et description */}
        <div className="w-full">
          <h4
            className="font-semibold text-sm text-foreground truncate w-full group-hover:text-primary transition-colors"
            title={link.title}
          >
            {link.title}
          </h4>
          {link.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={link.description}>
              {link.description}
            </p>
          )}
        </div>

        {/* Pied de carte avec lien discret */}
        <div className="mt-3 w-full flex items-center justify-center gap-1 text-[11px] text-muted-foreground/80 group-hover:text-primary">
          <span className="truncate max-w-[140px]">
            {link.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60 group-hover:opacity-100" />
        </div>
      </a>

      {/* Boutons d'actions rapides au survol */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/90 backdrop-blur-xs p-1 rounded-lg border border-border shadow-xs">
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          title="Copier l'URL"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {isEditMode && onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin(link);
            }}
            className={`p-1 rounded hover:bg-muted ${link.isPinned ? "text-amber-500" : "text-muted-foreground"}`}
            title={link.isPinned ? "Détacher" : "Épingler"}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}

        {isEditMode && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(link);
              }}
              className="p-1 rounded hover:bg-muted text-primary"
              title="Modifier"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(link.id);
              }}
              className="p-1 rounded hover:bg-destructive/10 text-destructive"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
