"use client";

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { Button } from "@/components/ui/button";
import {
  Save, Bold, Italic, List, ListOrdered, Heading1, Heading2,
  Table as TableIcon, Code, Quote, Link as LinkIcon,
  CheckSquare, Highlighter, Undo, Redo, Minus,
} from "lucide-react";
import { toast } from "sonner";

interface MeetingReportEditorProps {
  meetingId: string;
  initialContent: string;
  onSave: (markdown: string) => Promise<void>;
  onChange?: (markdown: string) => void;
  externalContentKey?: number;
}

/**
 * Éditeur WYSIWYG TipTap enrichi pour la rédaction des comptes rendus de réunion.
 * Fonctionnalités : Gras, Italique, H1, H2, Listes, Tableaux, Code, Citations,
 * Liens, To-do, Surlignage, Séparateur, Undo/Redo.
 */
export const MeetingReportEditor = ({
  meetingId,
  initialContent,
  onSave,
  onChange,
  externalContentKey,
}: MeetingReportEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const prevExternalKeyRef = React.useRef(externalContentKey);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // History est inclus dans StarterKit (undo/redo)
        // Blockquote est inclus dans StarterKit (citations)
        // CodeBlock est inclus dans StarterKit
      }),
      Markdown,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline cursor-pointer" } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: false }),
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown?.getMarkdown() ?? "";
      onChange?.(markdown);
    },
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-base focus:outline-none min-h-[400px] p-4 border rounded-md bg-background",
      },
    },
  });

  // Synchronise le contenu de l'éditeur lors d'une injection externe (ex: retour IA) ou au chargement initial
  useEffect(() => {
    if (!editor) return;
    const isExternalBump = externalContentKey !== undefined && externalContentKey !== prevExternalKeyRef.current;
    prevExternalKeyRef.current = externalContentKey;

    const currentMarkdown = (editor.storage as any).markdown?.getMarkdown() ?? "";
    if (isExternalBump || (!currentMarkdown && initialContent) || currentMarkdown.trim() !== (initialContent || "").trim()) {
      editor.commands.setContent(initialContent || "");
    }
  }, [editor, initialContent, externalContentKey]);

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    const markdown = (editor.storage as any).markdown.getMarkdown();
    await onSave(markdown);
    setIsSaving(false);
  };

  /** Demande une URL et insère un lien hypertexte */
  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien :", previousUrl || "https://");
    if (url === null) return; // Annulé
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return <div>Chargement de l&apos;éditeur...</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Barre d'outils enrichie */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border rounded-md bg-muted/30">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Formatage texte */}
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "bg-muted" : ""} title="Gras">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "bg-muted" : ""} title="Italique">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive("highlight") ? "bg-muted" : ""} title="Surligner">
            <Highlighter className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Titres */}
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""} title="Titre 1">
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""} title="Titre 2">
            <Heading2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Listes */}
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "bg-muted" : ""} title="Liste à puces">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "bg-muted" : ""} title="Liste numérotée">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleTaskList().run()} className={editor.isActive("taskList") ? "bg-muted" : ""} title="Liste de tâches">
            <CheckSquare className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Blocs */}
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "bg-muted" : ""} title="Citation">
            <Quote className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive("codeBlock") ? "bg-muted" : ""} title="Bloc de code">
            <Code className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSetLink} className={editor.isActive("link") ? "bg-muted" : ""} title="Lien">
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Tableau */}
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insérer un tableau">
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
            <Minus className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Undo / Redo */}
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>
      
      {/* Zone d'édition */}
      <div className="report-editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
