import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionUserId = cookieStore.get('auth_user_id')?.value;

    let user = null;
    if (sessionUserId) {
      user = await prisma.user.findUnique({
        where: { id: sessionUserId },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: 'ADMIN', isActive: true },
      });
    }

    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        department: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      currentUser: user
        ? {
            id: user.id,
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            designation: user.designation,
            avatar: user.avatar,
          }
        : null,
      availableUsers: allUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('auth_user_id', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
