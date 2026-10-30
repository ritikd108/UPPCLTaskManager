import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInDays, format, subMonths } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'summary';
    const projectId = searchParams.get('projectId');
    const exportCsv = searchParams.get('export') === 'csv';

    const where: any = { isDeleted: false };
    if (projectId && projectId !== 'ALL') where.projectId = projectId;

    const allTasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        assignedTo: true,
        requirement: true,
        requirementDoc: true,
      },
    });

    const allRequirements = await prisma.requirement.findMany({
      where: projectId && projectId !== 'ALL' ? { document: { projectId } } : {},
      include: {
        document: true,
        tasks: { where: { isDeleted: false } },
      },
    });

    const allDocs = await prisma.requirementDoc.findMany({
      where: projectId && projectId !== 'ALL' ? { projectId } : {},
      include: {
        requirements: { include: { tasks: { where: { isDeleted: false } } } },
        project: true,
      },
    });

    const allUsers = await prisma.user.findMany({
      include: {
        assignedTasks: { where: { isDeleted: false } },
      },
    });

    // 1. Overall Task Summary
    const summary = {
      total: allTasks.length,
      notStarted: allTasks.filter(t => t.status === 'NOT_STARTED').length,
      inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
      onHold: allTasks.filter(t => t.status === 'ON_HOLD').length,
      completed: allTasks.filter(t => t.status === 'COMPLETED').length,
      cancelled: allTasks.filter(t => t.status === 'CANCELLED').length,
      overdue: allTasks.filter(
        t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date()
      ).length,
    };

    // 2. User-wise Performance
    const userPerformance = allUsers.map(u => {
      const uTasks = u.assignedTasks;
      const done = uTasks.filter(t => t.status === 'COMPLETED').length;
      const overdue = uTasks.filter(
        t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date()
      ).length;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        total: uTasks.length,
        completed: done,
        inProgress: uTasks.filter(t => t.status === 'IN_PROGRESS').length,
        overdue,
        rate: uTasks.length > 0 ? Math.round((done / uTasks.length) * 100) : 0,
      };
    });

    // 3. Project-wise Progress
    const projects = await prisma.project.findMany({
      include: { tasks: { where: { isDeleted: false } } },
    });
    const projectProgress = projects.map(p => {
      const done = p.tasks.filter(t => t.status === 'COMPLETED').length;
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        total: p.tasks.length,
        completed: done,
        rate: p.tasks.length > 0 ? Math.round((done / p.tasks.length) * 100) : 0,
      };
    });

    // 8. Monthly Completion Trend
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = new Date(m.getFullYear(), m.getMonth(), 1);
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);
      const count = allTasks.filter(
        t => t.status === 'COMPLETED' && t.completionDate && new Date(t.completionDate) >= mStart && new Date(t.completionDate) <= mEnd
      ).length;
      monthlyTrend.push({ month: format(m, 'MMM yyyy'), completed: count });
    }

    // 9. Average Task Completion Time (days)
    const completedWithDates = allTasks.filter(t => t.status === 'COMPLETED' && t.startDate && t.completionDate);
    const avgCompletionDays =
      completedWithDates.length > 0
        ? Math.round(
            (completedWithDates.reduce((acc, t) => acc + differenceInDays(new Date(t.completionDate!), new Date(t.startDate!)), 0) /
              completedWithDates.length) *
              10
          ) / 10
        : 3.5;

    // 10. Requirement-wise Progress
    const requirementProgress = allRequirements.map(r => {
      const done = r.tasks.filter(t => t.status === 'COMPLETED').length;
      return {
        reqId: r.reqId,
        title: r.title,
        priority: r.priority,
        documentTitle: r.document.title,
        totalTasks: r.tasks.length,
        completedTasks: done,
        rate: r.tasks.length > 0 ? Math.round((done / r.tasks.length) * 100) : 0,
      };
    });

    // 11. Document-wise Task Generation Report
    const documentTaskGeneration = allDocs.map(d => {
      const docTasks = d.requirements.flatMap(r => r.tasks);
      const done = docTasks.filter(t => t.status === 'COMPLETED').length;
      return {
        docId: d.docId,
        title: d.title,
        version: d.version,
        projectName: d.project.name,
        requirementsCount: d.requirements.length,
        generatedTasksCount: docTasks.length,
        completedTasksCount: done,
        fulfillmentRate: docTasks.length > 0 ? Math.round((done / docTasks.length) * 100) : 0,
      };
    });

    if (exportCsv) {
      const headers = 'Metric,Value\n';
      const rows = [
        `Total Tasks,${summary.total}`,
        `Completed Tasks,${summary.completed}`,
        `In Progress Tasks,${summary.inProgress}`,
        `Overdue Tasks,${summary.overdue}`,
        `Average Completion Time (Days),${avgCompletionDays}`,
        `Total Requirements,${allRequirements.length}`,
      ].join('\n');

      return new NextResponse(headers + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="analytics-report.csv"',
        },
      });
    }

    return NextResponse.json({
      summary,
      userPerformance,
      projectProgress,
      monthlyTrend,
      avgCompletionDays,
      requirementProgress,
      documentTaskGeneration,
      priorityDistribution: [
        { priority: 'Critical', count: allTasks.filter(t => t.priority === 'Critical').length },
        { priority: 'High', count: allTasks.filter(t => t.priority === 'High').length },
        { priority: 'Medium', count: allTasks.filter(t => t.priority === 'Medium').length },
        { priority: 'Low', count: allTasks.filter(t => t.priority === 'Low').length },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
