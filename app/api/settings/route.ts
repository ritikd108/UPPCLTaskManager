import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canChangeSettings } from '@/lib/auth';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      settings: settingsMap,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canChangeSettings(user)) {
      return NextResponse.json({ error: 'Permission denied: Administrator role required.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, settings } = body;

    // Reset database to initial seed
    if (action === 'reset_database') {
      try {
        await execPromise('node prisma/seed.js');
        return NextResponse.json({ success: true, message: 'Database successfully reset and re-seeded with demo data.' });
      } catch (seedErr: any) {
        return NextResponse.json({ error: `Seed execution failed: ${seedErr.message}` }, { status: 500 });
      }
    }

    // Save individual system settings
    if (settings && typeof settings === 'object') {
      for (const [key, val] of Object.entries(settings)) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'Updated System Settings',
        entityType: 'USER',
        entityId: user.id,
        details: 'System configuration parameters modified.',
      },
    });

    return NextResponse.json({ success: true, message: 'Settings saved successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
