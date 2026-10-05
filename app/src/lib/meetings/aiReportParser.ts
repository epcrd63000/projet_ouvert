/**
 * @file aiReportParser.ts
 * Module d'analyse et d'extraction intelligente des comptes rendus de réunion générés par IA.
 * Découpe les objectifs, la synthèse rédigée et la liste des décisions/actions.
 */

export interface ParsedDecision {
  content: string;
  assigneeId: string | null;
  dueDate: string | null; // Format YYYY-MM-DD
}

export interface ParsedMeetingReport {
  objectives: string;
  synthesis: string;
  decisions: ParsedDecision[];
}

export interface UserCandidate {
  id: string;
  name: string;
  email: string;
}

/**
 * Normalise une chaîne de date (JJ/MM/AAAA ou AAAA-MM-JJ) vers le format standard ISO AAAA-MM-JJ.
 */
export function normalizeDateString(rawDate: string): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();

  // Format ISO : AAAA-MM-JJ
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Format Français : JJ/MM/AAAA
  const frMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frMatch) {
    const day = frMatch[1].padStart(2, "0");
    const month = frMatch[2].padStart(2, "0");
    const year = frMatch[3];
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Associe un nom ou prénom extrait à un utilisateur du projet.
 */
export function matchAssigneeToUser(
  rawName: string,
  users: UserCandidate[]
): UserCandidate | null {
  if (!rawName) return null;
  const query = rawName.trim().toLowerCase();

  // Recherche par correspondance exacte ou inclusion sur le prénom / nom
  for (const user of users) {
    const userName = user.name.toLowerCase();
    const userFirstName = userName.split(" ")[0];
    const emailPrefix = user.email.toLowerCase().split("@")[0];

    if (
      userName === query ||
      userFirstName === query ||
      userName.includes(query) ||
      query.includes(userFirstName) ||
      emailPrefix === query
    ) {
      return user;
    }
  }

  return null;
}

/**
 * Extrait une section délimitée par des balises [TAG]...[/TAG] ou par des titres Markdown.
 */
function extractSection(
  text: string,
  tagName: string,
  markdownHeaders: string[]
): string {
  // Recherche par balises explicites : [TAG]...[/TAG]
  const tagRegex = new RegExp(`\\[${tagName}\\]([\\s\\S]*?)\\[\\/${tagName}\\]`, "i");
  const tagMatch = text.match(tagRegex);
  if (tagMatch && tagMatch[1]) {
    return tagMatch[1].trim();
  }

  // Recherche par titres Markdown (ex: ## Objectifs)
  for (const header of markdownHeaders) {
    const headerRegex = new RegExp(
      `(?:^|\\n)#{1,4}\\s*.*${header}.*\\n([\\s\\S]*?)(?=(?:\\n#{1,4}\\s+)|$)`,
      "i"
    );
    const headerMatch = text.match(headerRegex);
    if (headerMatch && headerMatch[1]) {
      return headerMatch[1].trim();
    }
  }

  return "";
}

/**
 * Analyse une ligne de décision pour en extraire le responsable, l'échéance et le texte.
 */
export function parseDecisionLine(
  line: string,
  users: UserCandidate[]
): ParsedDecision | null {
  const cleanLine = line.replace(/^[\s*\-•\d\.\)]+/, "").trim();
  if (!cleanLine || cleanLine.length < 3) return null;

  let assigneeId: string | null = null;
  let dueDate: string | null = null;
  let remainingText = cleanLine;

  // Extraction des motifs entre crochets : [Etienne] [2026-10-15] Action
  const bracketMatches = Array.from(cleanLine.matchAll(/\[(.*?)\]/g));

  for (const match of bracketMatches) {
    const token = match[1].trim();
    // Vérifier si c'est une date
    const parsedDate = normalizeDateString(token);
    if (parsedDate) {
      dueDate = parsedDate;
      remainingText = remainingText.replace(match[0], "").trim();
      continue;
    }

    // Vérifier si c'est un membre de l'équipe
    const matchedUser = matchAssigneeToUser(token, users);
    if (matchedUser && !assigneeId) {
      assigneeId = matchedUser.id;
      remainingText = remainingText.replace(match[0], "").trim();
      continue;
    }
  }

  // Nettoyer les séparateurs restants (ex: "- " ou ": ")
  remainingText = remainingText.replace(/^[\-:\s]+/, "").trim();

  return {
    content: remainingText,
    assigneeId,
    dueDate,
  };
}

/**
 * Analyse le texte brut renvoyé par l'IA pour le ventiler dans les champs du compte rendu.
 */
export function parseAiMeetingReport(
  rawText: string,
  users: UserCandidate[]
): ParsedMeetingReport {
  if (!rawText) {
    return { objectives: "", synthesis: "", decisions: [] };
  }

  // 1. Extraction des objectifs
  const objectives = extractSection(rawText, "OBJECTIFS", [
    "Objectif",
    "Ordre du jour",
    "Agenda",
  ]);

  // 2. Extraction de la synthèse
  let synthesis = extractSection(rawText, "SYNTHESE", [
    "Synthèse",
    "Déroulé",
    "Échanges",
    "Discussions",
  ]);

  // 3. Extraction du relevé de décisions
  const decisionsBlock = extractSection(rawText, "DECISIONS", [
    "Décision",
    "Plan d'action",
    "Actions",
  ]);

  const decisions: ParsedDecision[] = [];
  if (decisionsBlock) {
    const lines = decisionsBlock.split(/\r?\n/);
    for (const line of lines) {
      const parsed = parseDecisionLine(line, users);
      if (parsed && parsed.content) {
        decisions.push(parsed);
      }
    }
  }

  // Si aucune balise n'a fonctionné, conserver le texte complet comme synthèse
  if (!objectives && !synthesis && decisions.length === 0) {
    synthesis = rawText.trim();
  }

  return {
    objectives,
    synthesis,
    decisions,
  };
}
