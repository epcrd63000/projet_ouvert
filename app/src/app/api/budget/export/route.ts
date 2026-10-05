import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * GET /api/budget/export — Exporte les dépenses et financements en CSV.
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const entries = await prisma.budgetEntry.findMany({
      orderBy: { date: "desc" },
      include: {
        createdBy: { select: { name: true } },
        fundingSource: { select: { name: true } },
      },
    });

    const header = "ID,Libellé,Source de Financement,Montant (€),Date,Catégorie,Statut,Créé par,Commentaire\n";
    const rows = entries
      .map((e) => {
        return [
          e.id,
          `"${e.label.replace(/"/g, '""')}"`,
          `"${(e.fundingSource?.name || "Non affectée").replace(/"/g, '""')}"`,
          Number(e.amount).toFixed(2),
          format(new Date(e.date), "yyyy-MM-dd"),
          e.category,
          e.status,
          `"${(e.createdBy?.name || "Utilisateur supprimé").replace(/"/g, '""')}"`,
          `"${(e.comment || "").replace(/"/g, '""')}"`,
        ].join(",");
      })
      .join("\n");

    const csvData = "\uFEFF" + header + rows; // BOM UTF-8 pour Excel

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="budget_minimoca_export.csv"',
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/budget/export:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
