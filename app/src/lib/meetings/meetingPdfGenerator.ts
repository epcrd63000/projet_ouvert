/**
 * @file meetingPdfGenerator.ts
 * Moteur de génération de PDF officiel pour les comptes rendus de réunion du Voilier MINIMOCA (IMT).
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { marked } from "marked";

export interface PdfMeetingData {
  id: string;
  title: string;
  scheduledAt: string;
  location?: string | null;
  status: string;
  organizerName?: string | null;
  objectives?: string | null;
  reportContent?: string | null;
  attendees: Array<{
    status: string;
    user: { name: string; email: string };
  }>;
  decisions: Array<{
    content: string;
    assignee?: { name: string } | null;
    dueDate?: string | null;
    task?: { status: string; progress: number } | null;
  }>;
}

/**
 * Construit un conteneur HTML stylisé aux normes IMT pour la génération PDF.
 */
function buildMeetingReportHtml(data: PdfMeetingData): HTMLElement {
  const container = document.createElement("div");
  container.style.width = "800px";
  container.style.padding = "40px";
  container.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.color = "#1e293b";
  container.style.background = "#ffffff";
  container.style.position = "absolute";
  container.style.left = "-9999px";

  const dateStr = new Date(data.scheduledAt).toLocaleString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const presents = data.attendees.filter((a) => a.status === "PRESENT").map((a) => a.user.name).join(", ") || "Aucun";
  const excuses = data.attendees.filter((a) => a.status === "EXCUSED").map((a) => a.user.name).join(", ") || "Aucun";
  const absents = data.attendees.filter((a) => a.status === "ABSENT").map((a) => a.user.name).join(", ") || "Aucun";

  const parsedSynthesis = data.reportContent ? marked.parse(data.reportContent) : "<p><em>Aucune synthèse rédigée.</em></p>";

  const decisionsRows = data.decisions.length === 0
    ? `<tr><td colspan="5" style="padding: 10px; text-align: center; color: #64748b; font-style: italic;">Aucune décision enregistrée</td></tr>`
    : data.decisions.map((d, index) => {
        const taskStatus = d.task ? (d.task.status === "DONE" ? "Terminée" : `En cours (${d.task.progress}%)`) : "Non convertie";
        const dueDate = d.dueDate ? new Date(d.dueDate).toLocaleDateString("fr-FR") : "-";
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
            <td style="padding: 8px; font-weight: bold; width: 30px;">#${index + 1}</td>
            <td style="padding: 8px;">${d.content}</td>
            <td style="padding: 8px; width: 140px;">${d.assignee?.name || "Non assigné"}</td>
            <td style="padding: 8px; width: 100px;">${dueDate}</td>
            <td style="padding: 8px; width: 110px;">${taskStatus}</td>
          </tr>
        `;
      }).join("");

  container.innerHTML = `
    <!-- En-tête officiel IMT -->
    <div style="border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em;">
          IMT — Projet Ouvert 2026-2027 • Voilier MINIMOCA
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">
          Compte Rendu de Réunion
        </h1>
      </div>
      <div style="text-align: right; font-size: 11px; color: #64748b;">
        <div><strong>Date :</strong> ${dateStr}</div>
        <div><strong>Lieu :</strong> ${data.location || "Salle de projet / En ligne"}</div>
      </div>
    </div>

    <!-- Métadonnées & Cartouche Réunion -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 12px;">
      <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${data.title}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div><strong>Organisateur :</strong> ${data.organizerName || "Non spécifié"}</div>
        <div><strong>Statut réunion :</strong> ${data.status}</div>
      </div>
    </div>

    <!-- Émargement -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 12px;">
      <div style="font-weight: 700; color: #1e293b; margin-bottom: 6px; text-transform: uppercase; font-size: 11px;">Feuille d'Émargement</div>
      <div style="margin-bottom: 4px;"><span style="color: #059669; font-weight: 600;">Présents :</span> ${presents}</div>
      <div style="margin-bottom: 4px;"><span style="color: #d97706; font-weight: 600;">Excusés :</span> ${excuses}</div>
      <div><span style="color: #dc2626; font-weight: 600;">Absents :</span> ${absents}</div>
    </div>

    <!-- Objectifs de la séance -->
    ${data.objectives ? `
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
        1. Objectifs & Ordre du Jour
      </h2>
      <div style="font-size: 12px; line-height: 1.6; white-space: pre-wrap;">${data.objectives}</div>
    </div>
    ` : ""}

    <!-- Synthèse rédigée -->
    <div style="margin-bottom: 25px;">
      <h2 style="font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
        2. Synthèse des Échanges
      </h2>
      <div style="font-size: 12px; line-height: 1.6;">${parsedSynthesis}</div>
    </div>

    <!-- Plan d'Action & Décisions -->
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px;">
        3. Relevé de Décisions & Plan d'Action
      </h2>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px;">N°</th>
            <th style="padding: 8px;">Action / Décision</th>
            <th style="padding: 8px;">Pilote</th>
            <th style="padding: 8px;">Échéance</th>
            <th style="padding: 8px;">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${decisionsRows}
        </tbody>
      </table>
    </div>

    <!-- Pied de page -->
    <div style="margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
      <span>Voilier MINIMOCA — École des Mines (IMT)</span>
      <span>Généré automatiquement par la Plateforme de Suivi de Projet</span>
    </div>
  `;

  return container;
}

/**
 * Génère le document jsPDF et déclenche le téléchargement du fichier PDF.
 */
export async function generateAndDownloadMeetingPdf(data: PdfMeetingData): Promise<void> {
  const container = buildMeetingReportHtml(data);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    
    // Ratio pixels → mm
    const ratio = pdfWidth / canvas.width;
    const totalPdfHeight = canvas.height * ratio;
    
    // Hauteur en pixels correspondant à une page A4
    const pageHeightPx = Math.floor(pdfPageHeight / ratio);
    const totalPages = Math.ceil(canvas.height / pageHeightPx);
    
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      
      // Découper une tranche du canvas pour cette page
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(pageHeightPx, canvas.height - page * pageHeightPx);
      
      const ctx = sliceCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, page * pageHeightPx,       // source x, y
          canvas.width, sliceCanvas.height, // source width, height
          0, 0,                           // dest x, y
          canvas.width, sliceCanvas.height  // dest width, height
        );
      }
      
      const sliceImgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
      const sliceHeight = sliceCanvas.height * ratio;
      pdf.addImage(sliceImgData, "JPEG", 0, 0, pdfWidth, sliceHeight);
    }
    const safeTitle = data.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    pdf.save(`Compte_Rendu_${safeTitle}_${data.id.slice(0, 6)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
