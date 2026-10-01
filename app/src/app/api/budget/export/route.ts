import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * GET /api/budget/export — Exporte les entrées budget en CSV.
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const entries = await prisma.budgetEntry.findMany({
      orderBy: { date: "desc" },
      include: { createdBy: { select: { name: true } } },
    });

    const header = "ID,Libellé,Montant,Date,Catégorie,Statut,Créé par,Commentaire\n";
    const rows = entries
      .map((e) => {
        return [
          e.id,
          `"${e.label.replace(/"/g, '""')}"`,
          e.amount,
          format(new Date(e.date), "yyyy-MM-dd"),
          e.category,
          e.status,
          `"${(e.createdBy?.name || "Utilisateur supprimé").replace(/"/g, '""')}"`,
          `"${(e.comment || "").replace(/"/g, '""')}"`,
        ].join(",");
      })
      .join("\n");

    const csvData = header + rows;

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="budget_export.csv"',
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/budget/export:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
