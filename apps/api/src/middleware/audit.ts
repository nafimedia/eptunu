import { prisma } from '@starter-kit/database';

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details || {},
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('❌ Failed to log audit event:', error);
  }
}
