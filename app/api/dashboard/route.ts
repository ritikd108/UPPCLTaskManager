import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, addDays, isPast, isToday, format, subDays, subMonths } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const projectFilter = projectId ? { projectId } : {};
    const taskWhereBase = {
      isDeleted: false,
      ...projectFilter,
    };

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const upcomingLimit = addDays(now, 7);

    // Fetch tasks
    const allTasks = await prisma.task.findMany({
      where: taskWhereBase,
      include: {
        project: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        category: { select: { id: true, name: true, color: true } },
        requirement: { select: { id: true, reqId: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch projects
    const allProjects = await prisma.project.findMany({
      include: {
        tasks: { where: { isDeleted: false } },
        requirementDocs: true,
      },
    });

    // Fetch requirement documents
    const allDocs = await prisma.requirementDoc.findMany({
      where: projectId ? { projectId } : {},
      include: {
        requirements: {
          include: {
            tasks: { where: { isDeleted: false } },
          },
        },
        project: { select: { name: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all requirements
    const allRequirements = await prisma.requirement.findMany({
      where: projectId ? { document: { projectId } } : {},
      include: {
        tasks: { where: { isDeleted: false } },
      },
    });

    // 10 KPI calculations
    const totalTasks = allTasks.length;
    const pendingTasks = allTasks.filter(t => t.status === 'NOT_STARTED').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
    const onHoldTasks = allTasks.filter(t => t.status === 'ON_HOLD').length;
    const cancelledTasks = allTasks.filter(t => t.status === 'CANCELLED').length;

    // Overdue tasks: dueDate < todayStart && not completed and not cancelled
    const overdueTasksList = allTasks.filter(
      t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < todayStart
    );
    const overdueTasks = overdueTasksList.length;

    // Due today
    const dueTodayTasksList = allTasks.filter(
      t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && isToday(new Date(t.dueDate))
    );
    const tasksDueToday = dueTodayTasksList.length;

    // Upcoming (within next 7 days, excluding today)
    const upcomingTasksList = allTasks.filter(t => {
      const d = new Date(t.dueDate);
      return t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && d > todayEnd && d <= upcomingLimit;
    });
    const upcomingTasks = upcomingTasksList.length;

    const activeProjects = allProjects.filter(p => p.status === 'Active').length;
    const totalRequirementDocuments = allDocs.length;
    const requirementsAwaitingTaskCreation = allRequirements.filter(r => r.tasks.length === 0).length;

    // Chart 1: Task Status Distribution (Donut)
    const statusDistribution = [
      { name: 'Not Started', value: pendingTasks, color: '#94a3b8' },
      { name: 'In Progress', value: inProgressTasks, color: '#0c8ee9' },
      { name: 'On Hold', value: onHoldTasks, color: '#f59e0b' },
      { name: 'Completed', value: completedTasks, color: '#10b981' },
      { name: 'Cancelled', value: cancelledTasks, color: '#ef4444' },
    ];

    // Chart 2: Priority-wise Distribution (Bar)
    const priorityDistribution = [
      { priority: 'Critical', count: allTasks.filter(t => t.priority === 'Critical').length, color: '#ef4444' },
      { priority: 'High', count: allTasks.filter(t => t.priority === 'High').length, color: '#f97316' },
      { priority: 'Medium', count: allTasks.filter(t => t.priority === 'Medium').length, color: '#0c8ee9' },
      { priority: 'Low', count: allTasks.filter(t => t.priority === 'Low').length, color: '#64748b' },
    ];

    // Chart 3: Weekly Task Completion (Line)
    const weeklyCompletion = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const dayStr = format(d, 'EEE');
      const start = startOfDay(d);
      const end = endOfDay(d);
      const count = allTasks.filter(
        t => t.status === 'COMPLETED' && t.completionDate && new Date(t.completionDate) >= start && new Date(t.completionDate) <= end
      ).length;
      weeklyCompletion.push({ day: dayStr, completed: count });
    }

    // Chart 4: User-wise Task Allocation (Bar)
    const userAllocationMap: Record<string, { name: string; total: number; completed: number }> = {};
    for (const t of allTasks) {
      const uName = t.assignedTo?.name || 'Unassigned';
      if (!userAllocationMap[uName]) {
        userAllocationMap[uName] = { name: uName, total: 0, completed: 0 };
      }
      userAllocationMap[uName].total++;
      if (t.status === 'COMPLETED') userAllocationMap[uName].completed++;
    }
    const userAllocation = Object.values(userAllocationMap);

    // Chart 5: Project-wise Progress (Progress)
    const projectProgress = allProjects.map(p => {
      const pTasks = p.tasks;
      const done = pTasks.filter(t => t.status === 'COMPLETED').length;
      const pct = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        total: pTasks.length,
        completed: done,
        progress: pct,
        status: p.status,
      };
    });

    // Chart 6: Monthly Task Completion (Trend Chart)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const monthLabel = format(m, 'MMM yyyy');
      const mStart = new Date(m.getFullYear(), m.getMonth(), 1);
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);
      const count = allTasks.filter(
        t => t.status === 'COMPLETED' && t.completionDate && new Date(t.completionDate) >= mStart && new Date(t.completionDate) <= mEnd
      ).length;
      monthlyTrend.push({ month: monthLabel, completed: count });
    }

    // Recent widgets data
    const recentlyCreatedTasks = allTasks.slice(0, 5);
    const recentlyUpdatedTasks = [...allTasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
    const upcomingDeadlines = upcomingTasksList.slice(0, 5);
    const overdueTasksWidget = overdueTasksList.slice(0, 5);
    const recentRequirementDocuments = allDocs.slice(0, 5);

    // Pending Task Approvals (Requirements with status Pending)
    const pendingApprovals = allRequirements.filter(r => r.analysisStatus === 'Pending').slice(0, 5);

    // Recent Activities
    const recentActivities = await prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } },
    });

    return NextResponse.json({
      kpis: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        tasksDueToday,
        upcomingTasks,
        activeProjects,
        totalRequirementDocuments,
        requirementsAwaitingTaskCreation,
      },
      charts: {
        statusDistribution,
        priorityDistribution,
        weeklyCompletion,
        userAllocation,
        projectProgress,
        monthlyTrend,
        overdueSummary: {
          critical: overdueTasksList.filter(t => t.priority === 'Critical').length,
          high: overdueTasksList.filter(t => t.priority === 'High').length,
          medium: overdueTasksList.filter(t => t.priority === 'Medium').length,
          low: overdueTasksList.filter(t => t.priority === 'Low').length,
        },
      },
      widgets: {
        recentlyCreatedTasks,
        recentlyUpdatedTasks,
        upcomingDeadlines,
        overdueTasks: overdueTasksWidget,
        recentRequirementDocuments,
        pendingApprovals,
        recentActivities,
      },
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
