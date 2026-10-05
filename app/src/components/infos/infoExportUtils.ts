import { saveAs } from "file-saver";
import { ImportantInfoItem, InfoFormData } from "./infoTypes";

/**
 * Exporte une fiche d'information au format Markdown (.md) enrichi.
 * Ajoute un en-tête cartouche standardisé avec titre, date, catégorie et interlocuteurs.
 */
export function exportInfoToMarkdown(info: ImportantInfoItem): void {
  const dateStr = info.eventDate
    ? new Date(info.eventDate).toLocaleDateString("fr-FR")
    : "Non spécifiée";

  const frontmatter = [
    "---",
    `titre: "${info.title.replace(/"/g, '\\"')}"`,
    `categorie: "${info.category}"`,
    `date_evenement: "${dateStr}"`,
    `interlocuteurs: "${info.interlocutors || "Non spécifiés"}"`,
    `epingle: ${info.isPinned}`,
    `exporte_le: "${new Date().toISOString()}"`,
    "---",
    "",
    `# ${info.title}`,
    "",
    "> **Fiche Projet Ouvert IMT Nord Europe**",
    `> **Catégorie :** ${info.category} | **Date de référence :** ${dateStr}`,
    info.interlocutors ? `> **Interlocuteurs :** ${info.interlocutors}` : "",
    "",
    "---",
    "",
    info.content,
  ]
    .filter(Boolean)
    .join("\n");

  const blob = new Blob([frontmatter], { type: "text/markdown;charset=utf-8" });
  const sanitizedTitle = info.title
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "_")
    .slice(0, 40);
  saveAs(blob, `${sanitizedTitle || "info_projet"}.md`);
}

/**
 * Analyse un fichier Markdown importé (.md) pour pré-remplir le formulaire.
 * Détecte les en-têtes YAML éventuels ou extrait le premier titre # du document.
 */
export function parseImportedMarkdown(fileContent: string, defaultFileName: string): Partial<InfoFormData> {
  let content = fileContent.trim();
  let title = defaultFileName.replace(/\.md$/i, "");
  let category = "GENERAL";
  let interlocutors = "";
  let eventDate = "";

  // Détection du frontmatter YAML si présent
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (frontmatterMatch) {
    const rawYaml = frontmatterMatch[1];
    content = frontmatterMatch[2].trim();

    const titleMatch = rawYaml.match(/titre:\s*"?([^"\n\r]+)"?/i);
    if (titleMatch) title = titleMatch[1].trim();

    const catMatch = rawYaml.match(/categorie:\s*"?([^"\n\r]+)"?/i);
    if (catMatch && ["ORGANISATION", "CALENDRIER", "TECHNIQUE", "GENERAL"].includes(catMatch[1].trim().toUpperCase())) {
      category = catMatch[1].trim().toUpperCase();
    }

    const interMatch = rawYaml.match(/interlocuteurs:\s*"?([^"\n\r]+)"?/i);
    if (interMatch) interlocutors = interMatch[1].trim();
  } else {
    // Si pas de YAML, extraction du premier titre # Markdown
    const firstHeaderMatch = content.match(/^#\s+(.+)$/m);
    if (firstHeaderMatch) {
      title = firstHeaderMatch[1].trim();
      // On retire le titre principal du corps pour éviter la redondance
      content = content.replace(/^#\s+.+\r?\n?/, "").trim();
    }
  }

  return {
    title,
    content,
    category,
    interlocutors,
    eventDate,
    isPinned: false,
  };
}
