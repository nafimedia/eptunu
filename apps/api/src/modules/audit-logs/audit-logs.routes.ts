import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';

export async function auditLogsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', hasRole(['SUPER_ADMIN', 'ADMIN_EPT']));

  fastify.get('/', async (request, reply) => {
    return reply.send({ success: true, data: [] });
  });
}

