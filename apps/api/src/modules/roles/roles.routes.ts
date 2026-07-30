import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hasPermission } from '../../middleware/rbac';
import { createAuditLog } from '../../middleware/audit';

export async function rolesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. LIST ROLES & PERMISSIONS
  fastify.get('/', { preHandler: [hasPermission('roles:read')] }, async (request, reply) => {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    const allPermissions = await prisma.permission.findMany();

    return reply.send({
      roles: roles.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions.map((p: any) => p.permission.name),
      })),
      permissions: allPermissions,
    });
  });

  // 2. UPDATE ROLE PERMISSIONS
  fastify.put('/:id/permissions', { preHandler: [hasPermission('roles:manage')] }, async (request, reply) => {
    const { id } = request.params as any;
    const { permissionIds } = request.body as { permissionIds: string[] };

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return reply.status(404).send({ message: 'Role not found' });
    }

    // Delete existing permissions for role
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });

    // Insert new permissions
    if (permissionIds && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((pId) => ({
          roleId: id,
          permissionId: pId,
        })),
      });
    }

    await createAuditLog({
      userId: request.user?.userId,
      action: 'UPDATE_ROLE_PERMISSIONS',
      entity: 'Role',
      entityId: id,
      details: { roleName: role.name, count: permissionIds.length },
      ipAddress: request.ip,
    });

    return reply.send({ message: `Permissions updated for role ${role.name}` });
  });
}
