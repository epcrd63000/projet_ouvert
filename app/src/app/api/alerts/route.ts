import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { NotificationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, level } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const titlePrefix = level === 'CRITICAL' ? '🔴 ALERTE CRITIQUE' : level === 'WARNING' ? '⚠️ AVERTISSEMENT' : 'ℹ️ INFORMATION';
    const title = `${titlePrefix}`;

    const users = await prisma.user.findMany({ select: { id: true } });
    
    // Create notifications for all users (compatible Neon HTTP serverless)
    for (const u of users) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: 'SYSTEM_ALERT' as NotificationType,
          title,
          body: message,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Notifications envoyées" }, { status: 201 });
  } catch (error) {
    console.error('Failed to create alert notification', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
