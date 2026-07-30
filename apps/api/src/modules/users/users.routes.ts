import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hasPermission } from '../../middleware/rbac';
import { hashPassword, comparePassword } from '../../services/hash';
import { createAuditLog } from '../../middleware/audit';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  avatarUrl: z.string().optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
});

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. UPDATE OWN PROFILE (SELF SERVICE)
  fastify.put('/profile', async (request, reply) => {
    const userId = request.user?.userId;
    const body = updateProfileSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : user.avatarUrl,
      },
      include: { role: true },
    });

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_PROFILE',
      entity: 'User',
      entityId: user.id,
      details: { name: updatedUser.name },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Profil berhasil diperbarui!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role.name,
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  });

  // 2. CHANGE OWN PASSWORD (SELF SERVICE)
  fastify.put('/profile/password', async (request, reply) => {
    const userId = request.user?.userId;
    const body = changePasswordSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const { isValid } = await comparePassword(body.currentPassword, user.passwordHash);
    if (!isValid) {
      return reply.status(400).send({
        success: false,
        message: 'Password saat ini yang Anda masukkan salah.',
      });
    }

    const newPasswordHash = await hashPassword(body.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await createAuditLog({
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: user.id,
      details: { message: 'Password successfully updated' },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Password berhasil diubah! Silakan gunakan password baru pada login berikutnya.',
    });
  });

  // 3. LIST USERS WITH PAGINATION, SEARCH, FILTER
  fastify.get('/', { preHandler: [hasPermission('users:read')] }, async (request, reply) => {
    const { search, role, page = '1', limit = '10' } = request.query as any;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role) {
      where.role = { name: role };
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { role: true },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        roleId: u.roleId,
        isActive: u.isActive,
        isSystem: u.isSystem,
        createdAt: u.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  });

  // 4. CREATE USER
  fastify.post('/', { preHandler: [hasPermission('users:create')] }, async (request, reply) => {
    const { name, email, password, roleId, isActive } = request.body as any;

    if (!name || !email || !password || !roleId) {
      return reply.status(400).send({ success: false, message: 'Name, email, password, and roleId are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(400).send({ success: false, message: 'Email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roleId,
        isActive: isActive ?? true,
      },
      include: { role: true },
    });

    await createAuditLog({
      userId: request.user?.userId,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role.name },
      ipAddress: request.ip,
    });

    return reply.status(201).send({ success: true, message: 'User created successfully', data: user });
  });

  // 5. UPDATE USER
  fastify.put('/:id', { preHandler: [hasPermission('users:update')] }, async (request, reply) => {
    const { id } = request.params as any;
    const { name, email, roleId, isActive, password } = request.body as any;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    const dataToUpdate: any = {
      name,
      email,
      roleId,
      isActive,
    };

    if (password && password.trim() !== '') {
      dataToUpdate.passwordHash = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: { role: true },
    });

    await createAuditLog({
      userId: request.user?.userId,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      details: { email: updatedUser.email },
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'User updated successfully', data: updatedUser });
  });

  // 6. DELETE USER
  fastify.delete('/:id', { preHandler: [hasPermission('users:delete')] }, async (request, reply) => {
    const { id } = request.params as any;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    if (user.isSystem) {
      return reply.status(400).send({ success: false, message: 'System users cannot be deleted' });
    }

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      userId: request.user?.userId,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: id,
      details: { email: user.email },
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'User deleted successfully' });
  });
}
