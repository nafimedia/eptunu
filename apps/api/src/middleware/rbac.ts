import { FastifyRequest, FastifyReply } from 'fastify';
import { ROLE_DETAILS } from '../modules/roles/roles.routes';

export function hasRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Token missing or invalid' });
    }

    const userRole = request.user.role || '';

    // SUPER_ADMIN always has full access
    if (userRole === 'SUPER_ADMIN') {
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        success: false,
        message: `Akses ditolak: Role '${userRole}' tidak diizinkan. Membutuhkan salah satu dari: [${allowedRoles.join(', ')}]`,
      });
    }
  };
}

export function hasPermission(requiredPermission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Token missing or invalid' });
    }

    const userRole = request.user.role || '';

    if (userRole === 'SUPER_ADMIN') {
      return;
    }

    const roleInfo = ROLE_DETAILS[userRole];
    if (!roleInfo || !roleInfo.permissions.includes(requiredPermission)) {
      return reply.status(403).send({
        success: false,
        message: `Akses ditolak: Anda tidak memiliki izin '${requiredPermission}'`,
      });
    }
  };
}

