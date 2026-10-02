"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Button } from "@/components/ui/button";
import { Copy, Save, Bold, Italic, List, ListOrdered, Heading1, Heading2, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface MeetingReportEditorProps {
  meetingId: string;
  initialContent: string;
  isDownloaded: boolean;
  onSave: (markdown: string) => Promise<void>;
  onDownloaded: () => Promise<void>;
}

export const MeetingReportEditor = ({ meetingId, initialContent, isDownloaded, onSave, onDownloaded }: MeetingReportEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] p-4 border rounded-md bg-background",
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    const markdown = editor.storage.markdown.getMarkdown();
    await onSave(markdown);
    setIsSaving(false);
  };

  const handleExportPDF = async () => {
    if (!editor) return;
    setIsExporting(true);
    
    // We create a temporary div to render the HTML for PDF generation
    const contentHtml = editor.getHTML();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = contentHtml;
    // Apply styling so it looks professional in PDF
    tempDiv.style.padding = "40px";
    tempDiv.style.fontFamily = "sans-serif";
    tempDiv.style.color = "#000";
    tempDiv.style.background = "#fff";
    tempDiv.style.width = "800px";
    // basic prose styles for PDF
    const style = document.createElement("style");
    style.innerHTML = `
      h1 { color: #1a56db; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
      h2 { color: #2563eb; font-size: 20px; margin-top: 20px; }
      p { line-height: 1.6; margin-bottom: 12px; }
      ul { padding-left: 20px; }
      li { margin-bottom: 4px; }
      strong { color: #111827; }
    `;
    tempDiv.appendChild(style);
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, { scale: 2 });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Compte_Rendu_Reunion_${meetingId}.pdf`);
      
      await onDownloaded();
      toast.success("PDF téléchargé avec succès !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du PDF.");
    } finally {
      document.body.removeChild(tempDiv);
      setIsExporting(false);
    }
  };

  if (!editor) {
    return <div>Chargement de l'éditeur...</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border rounded-md bg-muted/30">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "bg-muted" : ""}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "bg-muted" : ""}>
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "bg-muted" : ""}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "bg-muted" : ""}>
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Génération..." : "Exporter PDF"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>
      
      <div className="report-editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
