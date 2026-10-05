"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Pin, Download, Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ImportantInfoItem, CATEGORY_LABELS, CATEGORY_COLORS } from "./infoTypes";
import { InfoMarkdownRenderer } from "./infoMarkdownRenderer";
import { exportInfoToMarkdown } from "./infoExportUtils";

interface InfoCardProps {
  info: ImportantInfoItem;
  onEdit: (info: ImportantInfoItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (info: ImportantInfoItem) => void;
}

/**
 * Carte de présentation unifiée d'une fiche d'information importante
 * avec métadonnées, rendu Markdown enrichi et actions collaboratives.
 */
export function InfoCard({ info, onEdit, onDelete, onTogglePin }: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formattedEventDate = info.eventDate
    ? format(new Date(info.eventDate), "dd MMMM yyyy", { locale: fr })
    : null;

  const categoryLabel = CATEGORY_LABELS[info.category] || info.category;
  const categoryColorClass = CATEGORY_COLORS[info.category] || CATEGORY_COLORS.GENERAL;

  return (
    <Card className={`overflow-hidden transition-all duration-200 border shadow-sm hover:shadow-md ${info.isPinned ? "border-amber-500/50 bg-amber-500/[0.02]" : "border-border"}`}>
      <CardHeader className="p-5 pb-3 border-b border-border/50 bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-[280px]">
            <div className="flex flex-wrap items-center gap-2">
              {info.isPinned && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs">
                  <Pin className="w-3 h-3 fill-current" />
                  Épinglé
                </Badge>
              )}
              <Badge variant="outline" className={`${categoryColorClass} font-medium text-xs`}>
                {categoryLabel}
              </Badge>
              {formattedEventDate && (
                <Badge variant="secondary" className="gap-1 text-xs font-normal">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  Jalon : {formattedEventDate}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {info.title}
            </CardTitle>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={isExpanded ? "Replier la fiche" : "Déplier la fiche"}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {info.interlocutors && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-foreground/80">Interlocuteurs & Contacts :</span>
            <span className="truncate">{info.interlocutors}</span>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-5 pt-4 text-sm leading-relaxed">
          <InfoMarkdownRenderer content={info.content} />
        </CardContent>
      )}

      <CardFooter className="p-3 px-5 border-t border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Mis à jour le {format(new Date(info.updatedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => exportInfoToMarkdown(info)}
            title="Télécharger cette fiche en Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter .md
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => onTogglePin(info)}
            title={info.isPinned ? "Détacher cette fiche" : "Épingler en tête"}
          >
            <Pin className={`w-3.5 h-3.5 ${info.isPinned ? "fill-current text-amber-500" : ""}`} />
            {info.isPinned ? "Détacher" : "Épingler"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => onEdit(info)}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(info.id)}
            title="Supprimer la fiche"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
