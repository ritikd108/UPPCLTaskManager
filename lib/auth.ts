import { cookies } from 'next/headers';
import { prisma } from './prisma';

export interface AuthUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  department?: string | null;
  designation?: string | null;
  avatar?: string | null;
  isActive: boolean;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const sessionUserId = cookieStore.get('auth_user_id')?.value;

    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
      });
      if (user && user.isActive) {
        return {
          id: user.id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role as any,
          department: user.department,
          designation: user.designation,
          avatar: user.avatar,
          isActive: user.isActive,
        };
      }
    }

    // Default to the first Admin in database if no session cookie exists yet (for easy developer onboarding / testing)
    const defaultAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
    });
    if (defaultAdmin) {
      return {
        id: defaultAdmin.id,
        userId: defaultAdmin.userId,
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        role: defaultAdmin.role as any,
        department: defaultAdmin.department,
        designation: defaultAdmin.designation,
        avatar: defaultAdmin.avatar,
        isActive: defaultAdmin.isActive,
      };
    }
    return null;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

export function canManageUsers(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function canManageProjects(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
}

export function canCreateTasks(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
}

export function canDeleteTasks(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function canApproveTasks(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
}

export function canUploadDocs(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
}

export function canChangeSettings(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}
