import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const sendAlerts = async () => {
        try {
          const activeAlerts = await prisma.alertBanner.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          });
          controller.enqueue(`data: ${JSON.stringify(activeAlerts)}\n\n`);
        } catch (error) {
          console.error("Error fetching alerts for SSE:", error);
        }
      };

      // Send immediately
      await sendAlerts();

      // Poll every 10 seconds
      const intervalId = setInterval(sendAlerts, 10000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}


export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, level, isActive } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const alert = await prisma.alertBanner.create({
      data: { message, level: level || 'INFO', isActive: isActive ?? true }
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Failed to create alert', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
