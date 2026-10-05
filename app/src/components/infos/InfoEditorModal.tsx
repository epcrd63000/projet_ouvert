"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Edit2, Upload, FileText } from "lucide-react";
import { ImportantInfoItem, InfoFormData, CATEGORY_LABELS } from "./infoTypes";
import { InfoMarkdownRenderer } from "./infoMarkdownRenderer";
import { parseImportedMarkdown } from "./infoExportUtils";

interface InfoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InfoFormData, id?: string) => Promise<void>;
  initialData?: ImportantInfoItem | null;
}

export function InfoEditorModal({ isOpen, onClose, onSave, initialData }: InfoEditorModalProps) {
  const [formData, setFormData] = useState<InfoFormData>({
    title: "",
    content: "",
    category: "GENERAL",
    eventDate: "",
    interlocutors: "",
    isPinned: false,
  });
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        category: initialData.category,
        eventDate: initialData.eventDate
          ? new Date(initialData.eventDate).toISOString().split("T")[0]
          : "",
        interlocutors: initialData.interlocutors || "",
        isPinned: initialData.isPinned,
      });
    } else {
      setFormData({
        title: "",
        content: "",
        category: "GENERAL",
        eventDate: "",
        interlocutors: "",
        isPinned: false,
      });
    }
    setActiveTab("edit");
  }, [initialData, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseImportedMarkdown(text, file.name);
        setFormData((prev) => ({
          ...prev,
          title: parsed.title || prev.title,
          content: parsed.content || prev.content,
          category: parsed.category || prev.category,
          interlocutors: parsed.interlocutors || prev.interlocutors,
          eventDate: parsed.eventDate || prev.eventDate,
        }));
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave(formData, initialData?.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {initialData ? "Modifier la fiche d'information" : "Nouvelle fiche d'information"}
            </DialogTitle>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-md hover:bg-muted transition-colors">
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Charger un fichier .md</span>
              <input type="file" accept=".md,.markdown,text/plain" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="info-title" className="text-xs font-semibold">Titre de la fiche *</Label>
              <Input
                id="info-title"
                placeholder="Ex: Synthèse Technique MINIMOCA — Mât & Quille"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="info-category" className="text-xs font-semibold">Thématique / Catégorie *</Label>
              <select
                id="info-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== "ALL").map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="info-date" className="text-xs font-semibold">Date de référence / Jalon clé</Label>
              <Input
                id="info-date"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="info-contacts" className="text-xs font-semibold">Interlocuteurs & Contacts associés</Label>
              <Input
                id="info-contacts"
                placeholder="Ex: Patrice Hulot (Tuteur interne), Damien Seguin (Client)"
                value={formData.interlocutors}
                onChange={(e) => setFormData({ ...formData, interlocutors: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="info-pinned"
              checked={formData.isPinned}
              onCheckedChange={(checked) => setFormData({ ...formData, isPinned: !!checked })}
            />
            <Label htmlFor="info-pinned" className="text-xs font-medium cursor-pointer">
              Épingler cette fiche en haut de la liste (mise en avant prioritaire)
            </Label>
          </div>

          {/* Éditeur / Aperçu Markdown */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Contenu Markdown enrichi *</Label>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md">
                <Button
                  type="button"
                  variant={activeTab === "edit" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[11px] gap-1"
                  onClick={() => setActiveTab("edit")}
                >
                  <Edit2 className="w-3 h-3" /> Édition
                </Button>
                <Button
                  type="button"
                  variant={activeTab === "preview" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[11px] gap-1"
                  onClick={() => setActiveTab("preview")}
                >
                  <Eye className="w-3 h-3" /> Aperçu riche
                </Button>
              </div>
            </div>

            {activeTab === "edit" ? (
              <Textarea
                placeholder="Rédigez en Markdown enrichi : titres (##), listes (-), tableaux (| col |), citations (>)..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={12}
                className="font-mono text-xs leading-relaxed"
              />
            ) : (
              <div className="border border-input rounded-md p-4 min-h-[260px] max-h-[350px] overflow-y-auto bg-card">
                {formData.content ? (
                  <InfoMarkdownRenderer content={formData.content} />
                ) : (
                  <p className="text-muted-foreground text-xs italic">Aucun contenu à prévisualiser.</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : initialData ? "Mettre à jour" : "Créer la fiche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
