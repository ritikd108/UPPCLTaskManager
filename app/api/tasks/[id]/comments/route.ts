import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty.' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { assignedTo: true },
    });

    if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });

    const comment = await prisma.taskComment.create({
      data: {
        taskId: task.id,
        userId: user.id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Notify assignee if someone else comments
    if (task.assignedToId && task.assignedToId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: task.assignedToId,
          title: `New Comment on ${task.taskId}`,
          message: `${user.name} commented: "${content.slice(0, 80)}..."`,
          type: 'STATUS_CHANGED',
          link: `/tasks/${task.id}`,
        },
      });
    }

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
