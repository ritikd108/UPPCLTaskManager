import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canDeleteTasks } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            manager: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
          },
        },
        assignedTo: true,
        createdBy: true,
        category: true,
        requirement: {
          include: {
            document: true,
            tasks: {
              where: { isDeleted: false },
              select: { id: true, taskId: true, title: true, status: true, priority: true, assignedTo: true },
            },
          },
        },
        requirementDoc: true,
        dependencies: {
          include: {
            dependsOnTask: {
              include: { assignedTo: true },
            },
          },
        },
        dependants: {
          include: {
            task: {
              include: { assignedTo: true },
            },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        history: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task || task.isDeleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Task detail GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: { assignedTo: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      priority,
      status,
      assignedToId,
      categoryId,
      startDate,
      dueDate,
      deliverable,
      remarks,
      sourceReference,
      dependencyTaskIds,
      isRecurring,
      recurrenceRule,
    } = body;

    // Track changes for TaskHistory
    const historyEntries = [];

    if (priority && priority !== existingTask.priority) {
      historyEntries.push({
        taskId: existingTask.id,
        userId: user.id,
        changeType: 'PRIORITY_CHANGE',
        oldValue: existingTask.priority,
        newValue: priority,
        remarks: remarks || `Priority updated from ${existingTask.priority} to ${priority}`,
      });
    }

    if (assignedToId && assignedToId !== existingTask.assignedToId) {
      const newAssignee = await prisma.user.findUnique({ where: { id: assignedToId } });
      historyEntries.push({
        taskId: existingTask.id,
        userId: user.id,
        changeType: 'ASSIGNMENT_CHANGE',
        oldValue: existingTask.assignedTo?.name || 'Unassigned',
        newValue: newAssignee?.name || 'Unassigned',
        remarks: remarks || 'Reassigned task',
      });

      if (newAssignee && newAssignee.id !== user.id) {
        await prisma.notification.create({
          data: {
            userId: newAssignee.id,
            title: 'Task Reassigned',
            message: `You were reassigned to task "${existingTask.title}" (${existingTask.taskId}) by ${user.name}.`,
            type: 'TASK_ASSIGNED',
            link: `/tasks/${existingTask.id}`,
          },
        });
      }
    }

    if (dueDate && new Date(dueDate).toISOString() !== existingTask.dueDate.toISOString()) {
      historyEntries.push({
        taskId: existingTask.id,
        userId: user.id,
        changeType: 'DEADLINE_CHANGE',
        oldValue: existingTask.dueDate.toISOString().split('T')[0],
        newValue: new Date(dueDate).toISOString().split('T')[0],
        remarks: remarks || 'Deadline adjusted',
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: title ?? existingTask.title,
        description: description ?? existingTask.description,
        priority: priority ?? existingTask.priority,
        status: status ?? existingTask.status,
        assignedToId: assignedToId !== undefined ? assignedToId : existingTask.assignedToId,
        categoryId: categoryId !== undefined ? categoryId : existingTask.categoryId,
        startDate: startDate ? new Date(startDate) : existingTask.startDate,
        dueDate: dueDate ? new Date(dueDate) : existingTask.dueDate,
        deliverable: deliverable ?? existingTask.deliverable,
        remarks: remarks ?? existingTask.remarks,
        sourceReference: sourceReference ?? existingTask.sourceReference,
        isRecurring: isRecurring !== undefined ? Boolean(isRecurring) : existingTask.isRecurring,
        recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : existingTask.recurrenceRule,
      },
    });

    // Update dependencies if provided
    if (dependencyTaskIds && Array.isArray(dependencyTaskIds)) {
      await prisma.taskDependency.deleteMany({ where: { taskId: existingTask.id } });
      for (const depId of dependencyTaskIds) {
        if (depId && depId !== existingTask.id) {
          await prisma.taskDependency.create({
            data: {
              taskId: existingTask.id,
              dependsOnTaskId: depId,
            },
          });
        }
      }
    }

    if (historyEntries.length > 0) {
      await prisma.taskHistory.createMany({ data: historyEntries });
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Updated Task ${existingTask.taskId}`,
        entityType: 'TASK',
        entityId: existingTask.id,
        details: `Task details modified by ${user.name}.`,
      },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Task PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !canDeleteTasks(user)) {
      return NextResponse.json({ error: 'Permission denied: Only Administrators can delete tasks.' }, { status: 403 });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Soft delete
    await prisma.task.update({
      where: { id: params.id },
      data: { isDeleted: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Deleted Task ${task.taskId}`,
        entityType: 'TASK',
        entityId: task.id,
        details: `Task "${task.title}" was soft-deleted by Administrator ${user.name}.`,
      },
    });

    return NextResponse.json({ success: true, message: `Task ${task.taskId} deleted successfully.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
