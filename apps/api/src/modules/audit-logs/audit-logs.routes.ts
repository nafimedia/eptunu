import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';

const db = prisma as any;

export async function auditLogsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', hasRole(['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'EXECUTIVE']));

  fastify.get('/', async (request, reply) => {
    const { search, action, limit = '50', page = '1' } = request.query as any;
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action) {
      where.action = { contains: action };
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { targetModule: { contains: search } },
        { details: { contains: search } },
        { userName: { contains: search } },
        { ipAddress: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  });
}

