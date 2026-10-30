import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { addDays } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { requirementId, approvedTasks = [] } = body;

    if (!requirementId) {
      return NextResponse.json({ error: 'Requirement ID is required.' }, { status: 400 });
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: {
        document: {
          include: { project: true },
        },
      },
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found.' }, { status: 404 });
    }

    // Update requirement status to Approved
    await prisma.requirement.update({
      where: { id: requirement.id },
      data: { analysisStatus: 'Approved' },
    });

    const createdTasks = [];
    const taskCountBase = await prisma.task.count();
    let index = 1;

    for (const t of approvedTasks) {
      const taskId = `TSK-${String(taskCountBase + 500 + index++).padStart(3, '0')}`;
      const dueDate = t.dueDate ? new Date(t.dueDate) : addDays(new Date(), t.estimatedDays || 7);

      const task = await prisma.task.create({
        data: {
          taskId,
          title: t.title,
          description: t.description || `Generated from ${requirement.reqId}: ${requirement.title}`,
          projectId: requirement.document.projectId,
          assignedToId: t.assignedToId || null,
          createdById: user.id,
          priority: t.priority || requirement.priority || 'Medium',
          status: 'NOT_STARTED',
          startDate: new Date(),
          dueDate,
          deliverable: t.deliverable || requirement.deliverable,
          sourceType: 'REQUIREMENT_DOC',
          requirementDocId: requirement.documentId,
          requirementId: requirement.id,
          sourceReference: requirement.sourceSection || requirement.reqId,
        },
      });

      createdTasks.push(task);

      // Audit log entry for each approved task
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: `Approved & Created Task ${task.taskId}`,
          entityType: 'TASK',
          entityId: task.id,
          details: `Task "${task.title}" approved from requirement ${requirement.reqId}.`,
        },
      });

      if (task.assignedToId && task.assignedToId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: task.assignedToId,
            title: 'New Task Assignment',
            message: `Task ${task.taskId} ("${task.title}") was approved and assigned to you.`,
            type: 'TASK_ASSIGNED',
            link: `/tasks/${task.id}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully approved and created ${createdTasks.length} task(s).`,
      tasks: createdTasks,
    });
  } catch (error: any) {
    console.error('Task approval error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
