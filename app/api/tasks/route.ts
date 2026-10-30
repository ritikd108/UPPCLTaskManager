import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('projectId');
    const assignedToId = searchParams.get('assignedToId');
    const categoryId = searchParams.get('categoryId');
    const sourceType = searchParams.get('sourceType');
    const isOverdue = searchParams.get('isOverdue');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const exportCsv = searchParams.get('export') === 'csv';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { taskId: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
        { project: { name: { contains: search } } },
        { assignedTo: { name: { contains: search } } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (projectId && projectId !== 'ALL') {
      where.projectId = projectId;
    }

    if (assignedToId && assignedToId !== 'ALL') {
      where.assignedToId = assignedToId;
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (sourceType && sourceType !== 'ALL') {
      where.sourceType = sourceType;
    }

    if (isOverdue === 'true') {
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
      where.dueDate = { lt: startOfDay(new Date()) };
    }

    // Sorting logic
    let orderBy: any = { updatedAt: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    if (sortBy === 'dueDate') orderBy = { dueDate: sortOrder === 'asc' ? 'asc' : 'desc' };
    if (sortBy === 'priority') orderBy = { priority: 'desc' };
    if (sortBy === 'updatedAt') orderBy = { updatedAt: 'desc' };

    if (exportCsv) {
      const exportTasks = await prisma.task.findMany({
        where,
        include: {
          project: true,
          assignedTo: true,
          category: true,
          requirement: true,
        },
        orderBy,
      });

      const headers = 'Task ID,Title,Project,Assigned To,Priority,Status,Due Date,Source Type,Deliverable\n';
      const rows = exportTasks.map(t => {
        const clean = (str: string | null | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
        return [
          t.taskId,
          clean(t.title),
          clean(t.project?.name),
          clean(t.assignedTo?.name || 'Unassigned'),
          t.priority,
          t.status,
          t.dueDate.toISOString().split('T')[0],
          t.sourceType,
          clean(t.deliverable),
        ].join(',');
      }).join('\n');

      return new NextResponse(headers + rows, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="tasks-export.csv"',
        },
      });
    }

    const totalCount = await prisma.task.count({ where });
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        requirement: { select: { id: true, reqId: true, title: true, sourceSection: true } },
        requirementDoc: { select: { id: true, docId: true, title: true } },
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, taskId: true, title: true, status: true } },
          },
        },
        dependants: {
          include: {
            task: { select: { id: true, taskId: true, title: true, status: true } },
          },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Tasks GET API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      projectId,
      categoryId,
      assignedToId,
      priority = 'Medium',
      status = 'NOT_STARTED',
      startDate,
      dueDate,
      deliverable,
      remarks,
      sourceType = 'MANUAL',
      requirementDocId,
      requirementId,
      sourceReference,
      dependencyTaskIds = [],
      isRecurring = false,
      recurrenceRule,
    } = body;

    if (!title || !projectId || !dueDate) {
      return NextResponse.json({ error: 'Task Title, Project and Due Date are mandatory.' }, { status: 400 });
    }

    // Auto-generate unique Task ID
    const count = await prisma.task.count();
    const taskId = `TSK-${String(count + 501).padStart(3, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskId,
        title,
        description,
        projectId,
        categoryId: categoryId || null,
        assignedToId: assignedToId || null,
        createdById: user.id,
        priority,
        status,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: new Date(dueDate),
        completionDate: status === 'COMPLETED' ? new Date() : null,
        deliverable,
        remarks,
        sourceType,
        requirementDocId: requirementDocId || null,
        requirementId: requirementId || null,
        sourceReference,
        isRecurring: Boolean(isRecurring),
        recurrenceRule: recurrenceRule || null,
      },
    });

    // Create dependencies
    if (dependencyTaskIds && dependencyTaskIds.length > 0) {
      for (const depId of dependencyTaskIds) {
        if (depId && depId !== task.id) {
          await prisma.taskDependency.create({
            data: {
              taskId: task.id,
              dependsOnTaskId: depId,
            },
          });
        }
      }
    }

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Created Task ${task.taskId}`,
        entityType: 'TASK',
        entityId: task.id,
        details: `Task "${title}" created with priority ${priority} and due date ${dueDate}.`,
      },
    });

    // Notify assignee if assigned
    if (assignedToId && assignedToId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: 'New Task Assigned',
          message: `${user.name} assigned you to task "${task.title}" (${task.taskId}).`,
          type: 'TASK_ASSIGNED',
          link: `/tasks/${task.id}`,
        },
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error('Task create POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
