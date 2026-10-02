import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isActive } = await request.json();

    const alert = await prisma.alertBanner.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Failed to update alert', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
