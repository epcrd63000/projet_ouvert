"use client";

import React, { useMemo } from "react";
import { marked } from "marked";

interface InfoMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Composant de rendu Markdown enrichi avec styles Tailwind soignés
 * pour tableaux, titres, citations et listes méthodologiques.
 */
export function InfoMarkdownRenderer({ content, className = "" }: InfoMarkdownRendererProps) {
  const htmlContent = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(content || "") as string;
    } catch (err) {
      console.error("Erreur parsing Markdown:", err);
      return `<p>${content}</p>`;
    }
  }, [content]);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none 
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:border [&_table]:border-border [&_table]:rounded-lg [&_table]:overflow-hidden
        [&_th]:bg-muted/70 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:border-b [&_th]:border-border [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider
        [&_td]:p-2.5 [&_td]:border-b [&_td]:border-border/60 [&_td]:text-xs [&_td]:text-foreground/90
        [&_tr:hover]:bg-muted/30
        [&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:rounded-r-md [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:pb-1.5 [&_h1]:border-b [&_h1]:border-border
        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-border/50
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mt-4 [&_h3]:mb-1.5
        [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-3 [&_h4]:mb-1
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-2
        [&_li]:text-xs [&_li]:leading-relaxed [&_li]:text-foreground/90
        [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-primary
        [&_pre]:bg-muted/80 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3
        [&_hr]:my-4 [&_hr]:border-border
        [&_a]:text-primary [&_a]:underline [&_a]:hover:opacity-80
        ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
