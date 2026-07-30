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
  const mod = entity || targetModule || 'System';
  const detailStr = typeof details === 'string' ? details : JSON.stringify(details || {});
  console.log(`[AUDIT] [${action}] user:${userName || userId || 'anonymous'} (${userRole || ''}) module:${mod}:${entityId || ''} - ${detailStr}`);
}
