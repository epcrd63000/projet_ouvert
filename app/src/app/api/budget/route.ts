import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const budgetSchema = z.object({
  label: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().datetime().or(z.date().transform(d => d.toISOString())),
  category: z.enum(["SUPPLIES", "SERVICES", "SOFTWARE", "OTHER"]),
  comment: z.string().optional(),
  status: z.enum(["PLANNED", "VALIDATED", "PAID"]).default("PLANNED"),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const entries = await prisma.budgetEntry.findMany({
      orderBy: { date: "desc" },
      include: { createdBy: { select: { name: true, email: true } } }
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 });

    const body = await req.json();
    const data = budgetSchema.parse(body);

    const project = await prisma.project.findFirst();
    if (!project) return new NextResponse("Project not found", { status: 404 });

    const newEntry = await prisma.budgetEntry.create({
      data: {
        label: data.label,
        amount: data.amount,
        date: new Date(data.date),
        category: data.category,
        comment: data.comment,
        status: data.status,
        projectId: project.id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(newEntry);
  } catch (error) {
    console.error(error);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
