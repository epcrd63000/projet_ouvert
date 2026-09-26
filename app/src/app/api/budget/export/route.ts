import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const entries = await prisma.budgetEntry.findMany({
      orderBy: { date: "desc" },
      include: { createdBy: { select: { name: true } } }
    });

    const header = "ID,Libellé,Montant,Date,Catégorie,Statut,Créé par,Commentaire\n";
    const rows = entries.map(e => {
      return [
        e.id,
        `"${e.label.replace(/"/g, '""')}"`,
        e.amount,
        format(new Date(e.date), "yyyy-MM-dd"),
        e.category,
        e.status,
        `"${e.createdBy.name.replace(/"/g, '""')}"`,
        `"${(e.comment || "").replace(/"/g, '""')}"`
      ].join(",");
    }).join("\n");

    const csvData = header + rows;

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="budget_export.csv"',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
