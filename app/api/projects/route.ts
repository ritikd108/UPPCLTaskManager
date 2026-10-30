import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canManageProjects } from '@/lib/auth';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, designation: true } },
          },
        },
        tasks: {
          where: { isDeleted: false },
          select: { id: true, status: true, priority: true, dueDate: true },
        },
        requirementDocs: {
          select: { id: true, title: true, version: true, status: true },
        },
        categories: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = projects.map(p => {
      const total = p.tasks.length;
      const completed = p.tasks.filter(t => t.status === 'COMPLETED').length;
      const inProgress = p.tasks.filter(t => t.status === 'IN_PROGRESS').length;
      const pending = p.tasks.filter(t => t.status === 'NOT_STARTED').length;
      const overdue = p.tasks.filter(
        t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date()
      ).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...p,
        stats: {
          total,
          completed,
          inProgress,
          pending,
          overdue,
          progress,
          docCount: p.requirementDocs.length,
          memberCount: p.members.length,
        },
      };
    });

    return NextResponse.json({ projects: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageProjects(user)) {
      return NextResponse.json({ error: 'Permission denied: Manager or Administrator role required.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description, startDate, targetDate, managerId, memberIds = [] } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Project Name and Project Code are required.' }, { status: 400 });
    }

    const count = await prisma.project.count();
    const projectId = `PRJ-${String(count + 101).padStart(3, '0')}`;

    const project = await prisma.project.create({
      data: {
        projectId,
        name,
        code: code.toUpperCase().trim(),
        description,
        startDate: startDate ? new Date(startDate) : new Date(),
        targetDate: targetDate ? new Date(targetDate) : null,
        managerId: managerId || user.id,
      },
    });

    // Create default project categories
    const defaultCats = ['API & Backend', 'Frontend & UI', 'QA & Testing', 'DevOps & Infrastructure'];
    for (const catName of defaultCats) {
      await prisma.category.create({
        data: { name: catName, projectId: project.id },
      });
    }

    // Add manager & members
    const membersToInsert = [{ projectId: project.id, userId: managerId || user.id, role: 'Project Manager' }];
    for (const mId of memberIds) {
      if (mId !== (managerId || user.id)) {
        membersToInsert.push({ projectId: project.id, userId: mId, role: 'Team Member' });
      }
    }
    await prisma.projectMember.createMany({ data: membersToInsert });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Created Project ${project.projectId}`,
        entityType: 'PROJECT',
        entityId: project.id,
        details: `Project "${project.name}" (${project.code}) initialized.`,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
