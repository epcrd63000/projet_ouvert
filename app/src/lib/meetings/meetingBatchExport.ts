/**
 * @file meetingBatchExport.ts
 * Utilitaire pour l'export groupé des comptes rendus de réunions sous forme d'archive ZIP contenant les PDF.
 */

import JSZip from "jszip";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { marked } from "marked";
import { MeetingListItem } from "@/components/meetings/MeetingCard";

/**
 * Exporte un ensemble de comptes rendus de réunion au format PDF compressés dans une archive ZIP.
 */
export async function exportMeetingsZip(
  meetingsToExport: MeetingListItem[],
  onMeetingMarkedDownloaded?: (id: string) => Promise<void>
): Promise<{ success: boolean; skippedCount: number }> {
  const zip = new JSZip();
  const tempDiv = document.createElement("div");
  tempDiv.style.padding = "40px";
  tempDiv.style.fontFamily = "sans-serif";
  tempDiv.style.color = "#000";
  tempDiv.style.background = "#fff";
  tempDiv.style.width = "800px";
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";

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

  let skippedCount = 0;

  try {
    for (const meeting of meetingsToExport) {
      if (!meeting.reportContent) {
        skippedCount++;
        continue;
      }

      const htmlContent = await marked.parse(meeting.reportContent);
      const contentContainer = document.createElement("div");
      contentContainer.innerHTML = htmlContent;
      tempDiv.appendChild(contentContainer);

      const canvas = await html2canvas(tempDiv, { scale: 2 });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      const pdfBlob = pdf.output("blob");
      const safeTitle = meeting.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      zip.file(`Compte_Rendu_${safeTitle}.pdf`, pdfBlob);

      tempDiv.removeChild(contentContainer);

      if (!meeting.isReportDownloaded && onMeetingMarkedDownloaded) {
        await onMeetingMarkedDownloaded(meeting.id);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "Comptes_Rendus_Reunions.zip");
    return { success: true, skippedCount };
  } finally {
    if (tempDiv.parentNode) {
      document.body.removeChild(tempDiv);
    }
  }
}
