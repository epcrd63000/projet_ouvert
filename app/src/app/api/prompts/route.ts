import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    // Allow any authenticated user to fetch prompts
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prompts = await prisma.aiPrompt.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Failed to fetch prompts', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    const prompt = await prisma.aiPrompt.create({
      data: { title, content },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
