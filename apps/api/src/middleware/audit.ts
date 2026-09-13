import { prisma } from '@starter-kit/database';

const db = prisma as any;

export async function createAuditLog({
  userId,
  userName,
  userRole,
  action,
  entity,
  targetModule,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity?: string;
  targetModule?: string;
  entityId?: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const mod = targetModule || entity || 'System';
  const detailStr = typeof details === 'string' ? details : JSON.stringify(details || {});
  console.log(`[AUDIT] [${action}] user:${userName || userId || 'anonymous'} (${userRole || ''}) module:${mod}:${entityId || ''} - ${detailStr}`);

  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        userName: userName || null,
        userRole: userRole || null,
        action,
        targetModule: mod,
        entityId: entityId || null,
        details: detailStr,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error('Failed to persist audit log to database:', err);
  }
}
