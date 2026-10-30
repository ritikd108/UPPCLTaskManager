import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await prisma.requirementDoc.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            members: { include: { user: true } },
          },
        },
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true } },
        requirements: {
          include: {
            tasks: {
              where: { isDeleted: false },
              include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                dependencies: { include: { dependsOnTask: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        tasks: {
          where: { isDeleted: false },
          include: {
            assignedTo: { select: { id: true, name: true } },
            requirement: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, description, status, version, rawContent } = body;

    const doc = await prisma.requirementDoc.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        status: status !== undefined ? status : undefined,
        version: version !== undefined ? version : undefined,
        rawContent: rawContent !== undefined ? rawContent : undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Updated Requirement Document ${doc.docId}`,
        entityType: 'DOCUMENT',
        entityId: doc.id,
        details: `Updated metadata/status to ${doc.status}.`,
      },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied: Administrator role required.' }, { status: 403 });
    }

    const doc = await prisma.requirementDoc.findUnique({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await prisma.requirementDoc.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `Deleted Requirement Document ${doc.docId}`,
        entityType: 'DOCUMENT',
        entityId: doc.id,
        details: `Document "${doc.title}" deleted.`,
      },
    });

    return NextResponse.json({ success: true, message: `Document ${doc.docId} deleted.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
