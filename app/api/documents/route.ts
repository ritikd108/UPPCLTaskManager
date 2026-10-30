import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canUploadDocs } from '@/lib/auth';
import { parseDocumentBuffer, importGoogleDocContent } from '@/lib/docParser';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (projectId && projectId !== 'ALL') where.projectId = projectId;
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { docId: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const documents = await prisma.requirementDoc.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true } },
        requirements: {
          include: {
            tasks: {
              where: { isDeleted: false },
              select: { id: true, taskId: true, status: true },
            },
          },
        },
        _count: {
          select: { requirements: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = documents.map(doc => {
      const allTasks = doc.requirements.flatMap(r => r.tasks);
      const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
      const completionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

      return {
        ...doc,
        stats: {
          requirementCount: doc.requirements.length,
          taskCount: allTasks.length,
          completedTaskCount: completedTasks,
          completionRate,
        },
      };
    });

    return NextResponse.json({ documents: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canUploadDocs(user)) {
      return NextResponse.json({ error: 'Permission denied: Manager or Administrator role required.' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';

    let title = '';
    let description = '';
    let projectId = '';
    let version = '1.0';
    let fileType = 'TXT';
    let rawContent = '';
    let googleDocId = '';
    let googleDocUrl = '';
    let fileSize = 0;

    // Handle multipart form data (File Uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      projectId = (formData.get('projectId') as string) || '';
      version = (formData.get('version') as string) || '1.0';

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      if (!title) {
        title = file.name.replace(/\.[^/.]+$/, '');
      }

      fileSize = file.size;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const parsed = await parseDocumentBuffer(buffer, file.name);
      rawContent = parsed.text;
      const ext = file.name.split('.').pop()?.toUpperCase() || 'TXT';
      fileType = ext;
    } else {
      // Handle JSON body (e.g. Google Docs import or direct text specification)
      const body = await req.json();
      title = body.title;
      description = body.description;
      projectId = body.projectId;
      version = body.version || '1.0';
      fileType = body.fileType || 'GOOGLE_DOC';
      googleDocUrl = body.googleDocUrl || '';

      if (body.googleDocUrl || body.googleDocId) {
        const docResult = await importGoogleDocContent(body.googleDocUrl || body.googleDocId, body.accessToken);
        rawContent = docResult.content;
        googleDocId = docResult.googleDocId;
        if (!title) title = docResult.title;
        fileType = 'GOOGLE_DOC';
      } else {
        rawContent = body.content || '';
      }
    }

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Document Title and Project are required.' }, { status: 400 });
    }

    // Auto-generate Document ID
    const docCount = await prisma.requirementDoc.count();
    const docId = `DOC-${String(docCount + 1001).padStart(4, '0')}`;

    const doc = await prisma.requirementDoc.create({
      data: {
        docId,
        title,
        description,
        fileType,
        fileSize,
        googleDocId: googleDocId || null,
        googleDocUrl: googleDocUrl || null,
        version,
        status: 'Active',
        rawContent,
        projectId,
        uploadedById: user.id,
      },
      include: {
        project: true,
        uploadedBy: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Uploaded Requirement Document ${doc.docId}`,
        entityType: 'DOCUMENT',
        entityId: doc.id,
        details: `Uploaded document "${doc.title}" (Version ${doc.version}, Type: ${fileType}).`,
      },
    });

    // Notify project manager if someone else uploaded
    if (doc.project.managerId && doc.project.managerId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: doc.project.managerId,
          title: 'New Requirement Document Uploaded',
          message: `${user.name} uploaded "${doc.title}" to project ${doc.project.name}.`,
          type: 'DOC_UPLOADED',
          link: `/documents/${doc.id}`,
        },
      });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error('Document POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
