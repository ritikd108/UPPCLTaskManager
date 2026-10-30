import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { analyzeDocumentWithAI } from '@/lib/ai';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const doc = await prisma.requirementDoc.findUnique({
      where: { id: params.id },
      include: { project: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    if (!doc.rawContent || doc.rawContent.trim().length === 0) {
      return NextResponse.json({ error: 'Document has no text content to analyze.' }, { status: 400 });
    }

    const aiResult = await analyzeDocumentWithAI(doc.title, doc.rawContent, doc.project.name);

    // Persist extracted requirements into Requirement table
    const savedRequirements = [];
    let reqIndex = 1;
    for (const reqItem of aiResult.requirements) {
      const existingCount = await prisma.requirement.count();
      const reqId = `REQ-${String(existingCount + reqIndex++).padStart(3, '0')}`;

      // Check if requirement already exists by title
      const existing = await prisma.requirement.findFirst({
        where: {
          documentId: doc.id,
          title: reqItem.title,
        },
      });

      if (existing) {
        const updated = await prisma.requirement.update({
          where: { id: existing.id },
          data: {
            description: reqItem.description,
            sourceSection: reqItem.sourceSection || existing.sourceSection,
            sourcePage: reqItem.sourcePage || existing.sourcePage,
            priority: reqItem.priority,
            deliverable: reqItem.deliverable,
            dependencies: reqItem.dependencies,
          },
        });
        savedRequirements.push({ ...updated, suggestedTasks: reqItem.suggestedTasks });
      } else {
        const created = await prisma.requirement.create({
          data: {
            reqId,
            documentId: doc.id,
            title: reqItem.title,
            description: reqItem.description,
            sourceSection: reqItem.sourceSection,
            sourcePage: reqItem.sourcePage,
            priority: reqItem.priority,
            deliverable: reqItem.deliverable,
            dependencies: reqItem.dependencies,
            analysisStatus: 'Pending',
          },
        });
        savedRequirements.push({ ...created, suggestedTasks: reqItem.suggestedTasks });
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `AI Analyzed Document ${doc.docId}`,
        entityType: 'DOCUMENT',
        entityId: doc.id,
        details: `AI extracted ${savedRequirements.length} requirements.`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'AI Analysis Complete',
        message: `Extracted ${savedRequirements.length} actionable requirements from "${doc.title}".`,
        type: 'AI_ANALYSIS_COMPLETE',
        link: `/analysis?documentId=${doc.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: {
        objective: aiResult.objective,
        summary: aiResult.summary,
        ambiguities: aiResult.ambiguities,
        requirements: savedRequirements,
      },
    });
  } catch (error: any) {
    console.error('AI analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
