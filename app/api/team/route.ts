import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canManageUsers } from '@/lib/auth';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        assignedTasks: {
          where: { isDeleted: false },
          select: { id: true, status: true, priority: true, dueDate: true },
        },
        memberships: {
          include: {
            project: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const enriched = users.map(u => {
      const tasks = u.assignedTasks;
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'COMPLETED').length;
      const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
      const overdue = tasks.filter(
        t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < now
      ).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: u.id,
        userId: u.userId,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        designation: u.designation,
        avatar: u.avatar,
        isActive: u.isActive,
        createdAt: u.createdAt,
        projects: u.memberships.map(m => m.project),
        stats: {
          totalTasks: total,
          completedTasks: completed,
          inProgressTasks: inProgress,
          overdueTasks: overdue,
          completionRate,
        },
      };
    });

    return NextResponse.json({ users: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageUsers(user)) {
      return NextResponse.json({ error: 'Permission denied: Only Administrators can create or modify users.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role = 'USER', department, designation, projectIds = [] } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const userCount = await prisma.user.count();
    const userId = `USR-${String(userCount + 1).padStart(3, '0')}`;

    const newUser = await prisma.user.create({
      data: {
        userId,
        name,
        email: email.toLowerCase().trim(),
        role,
        department,
        designation,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    if (projectIds.length > 0) {
      for (const pId of projectIds) {
        await prisma.projectMember.create({
          data: {
            projectId: pId,
            userId: newUser.id,
            role: designation || 'Team Member',
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Added User ${newUser.userId}`,
        entityType: 'USER',
        entityId: newUser.id,
        details: `Created user account for "${newUser.name}" (${newUser.role}).`,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageUsers(user)) {
      return NextResponse.json({ error: 'Permission denied: Only Administrators can modify users.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, role, department, designation, isActive } = body;

    if (!id) return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        role: role !== undefined ? role : undefined,
        department: department !== undefined ? department : undefined,
        designation: designation !== undefined ? designation : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Modified User ${updated.userId}`,
        entityType: 'USER',
        entityId: updated.id,
        details: `User profile / role updated by Administrator.`,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
