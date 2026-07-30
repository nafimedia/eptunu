import { FastifyRequest, FastifyReply } from 'fastify';

export function hasPermission(requiredPermission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { roleName, permissions } = request.user;

    // Superadmin bypasses permission checks
    if (roleName === 'SUPER_ADMIN') {
      return;
    }

    if (!permissions || !permissions.includes(requiredPermission)) {
      return reply.status(403).send({
        message: `Forbidden: You lack required permission '${requiredPermission}'`,
      });
    }
  };
}

export function hasRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(request.user.roleName || '')) {
      return reply.status(403).send({
        message: `Forbidden: Requires one of roles: [${allowedRoles.join(', ')}]`,
      });
    }
  };
}
