import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { status, remarks } = body;

    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        dependencies: {
          include: {
            dependsOnTask: true,
          },
        },
        requirement: true,
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    // Dependency validation: if starting or completing task, verify all prerequisite tasks are completed!
    if ((status === 'IN_PROGRESS' || status === 'COMPLETED') && task.dependencies.length > 0) {
      const incompletePrereqs = task.dependencies.filter(
        d => d.dependsOnTask.status !== 'COMPLETED'
      );

      if (incompletePrereqs.length > 0) {
        const prereqList = incompletePrereqs
          .map(d => `${d.dependsOnTask.taskId} ("${d.dependsOnTask.title}") [${d.dependsOnTask.status}]`)
          .join(', ');
        return NextResponse.json(
          {
            error: `Workflow Validation Error: Cannot transition to ${status}. Unfinished prerequisite task(s): ${prereqList}. All dependencies must be Completed first.`,
            uncompletedDependencies: incompletePrereqs.map(d => d.dependsOnTask),
          },
          { status: 400 }
        );
      }
    }

    const previousStatus = task.status;
    const isNowCompleted = status === 'COMPLETED';

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        status,
        completionDate: isNowCompleted ? new Date() : (status === 'NOT_STARTED' ? null : task.completionDate),
      },
    });

    // Record audit history
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        userId: user.id,
        changeType: 'STATUS_CHANGE',
        oldValue: previousStatus,
        newValue: status,
        remarks: remarks || `Status changed from ${previousStatus} to ${status} by ${user.name}`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Status Change: ${task.taskId} -> ${status}`,
        entityType: 'TASK',
        entityId: task.id,
        details: remarks ? `Status changed to ${status}. Remarks: ${remarks}` : `Status changed to ${status}.`,
      },
    });

    // If recurring task was marked COMPLETED, auto-schedule next occurrence!
    let nextRecurringTask = null;
    if (isNowCompleted && task.isRecurring && task.recurrenceRule) {
      let nextDue = new Date(task.dueDate);
      if (task.recurrenceRule === 'DAILY') nextDue = addDays(nextDue, 1);
      else if (task.recurrenceRule === 'WEEKLY') nextDue = addWeeks(nextDue, 1);
      else if (task.recurrenceRule === 'MONTHLY') nextDue = addMonths(nextDue, 1);
      else if (task.recurrenceRule === 'YEARLY') nextDue = addYears(nextDue, 1);

      const count = await prisma.task.count();
      const nextTaskId = `TSK-${String(count + 501).padStart(3, '0')}`;

      nextRecurringTask = await prisma.task.create({
        data: {
          taskId: nextTaskId,
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          categoryId: task.categoryId,
          assignedToId: task.assignedToId,
          createdById: user.id,
          priority: task.priority,
          status: 'NOT_STARTED',
          startDate: new Date(),
          dueDate: nextDue,
          deliverable: task.deliverable,
          sourceType: task.sourceType,
          requirementDocId: task.requirementDocId,
          requirementId: task.requirementId,
          isRecurring: true,
          recurrenceRule: task.recurrenceRule,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: `Auto-generated Recurring Task ${nextTaskId}`,
          entityType: 'TASK',
          entityId: nextRecurringTask.id,
          details: `Next occurrence of recurring task scheduled for ${nextDue.toISOString().split('T')[0]}.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      nextRecurringTask,
    });
  } catch (error: any) {
    console.error('Task status update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
