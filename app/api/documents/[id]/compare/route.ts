import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { compareDocumentRevisions } from '@/lib/ai';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentDoc = await prisma.requirementDoc.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            tasks: { where: { isDeleted: false }, select: { id: true, taskId: true, title: true, requirementId: true } },
          },
        },
      },
    });

    if (!currentDoc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { comparisonDocId, revisedContent } = body;

    let targetContent = revisedContent;
    let targetDocTitle = currentDoc.title;

    if (comparisonDocId) {
      const compDoc = await prisma.requirementDoc.findUnique({ where: { id: comparisonDocId } });
      if (compDoc) {
        targetContent = compDoc.rawContent || '';
        targetDocTitle = compDoc.title;
      }
    }

    if (!targetContent) {
      return NextResponse.json({ error: 'No comparison content or document provided.' }, { status: 400 });
    }

    const existingTasksFormatted = currentDoc.project.tasks.map(t => ({
      taskId: t.taskId,
      title: t.title,
      requirementRef: t.requirementId || undefined,
    }));

    const result = await compareDocumentRevisions(
      targetDocTitle,
      currentDoc.rawContent || '',
      targetContent,
      existingTasksFormatted
    );

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Compared Document Revisions for ${currentDoc.docId}`,
        entityType: 'DOCUMENT',
        entityId: currentDoc.id,
        details: `Comparison generated: ${result.summary}`,
      },
    });

    return NextResponse.json({
      success: true,
      comparison: result,
    });
  } catch (error: any) {
    console.error('Document compare error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
