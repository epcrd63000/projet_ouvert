import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().datetime().or(z.date().transform(d => d.toISOString())).optional(),
  category: z.enum(["SUPPLIES", "SERVICES", "SOFTWARE", "OTHER"]).optional(),
  comment: z.string().optional(),
  status: z.enum(["PLANNED", "VALIDATED", "PAID"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 });

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.budgetEntry.update({
      where: { id: params.id },
      data: {
        ...(data.label && { label: data.label }),
        ...(data.amount && { amount: data.amount }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.category && { category: data.category }),
        ...(data.comment !== undefined && { comment: data.comment }),
        ...(data.status && { status: data.status }),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return new NextResponse("Bad Request", { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 });

    await prisma.budgetEntry.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
