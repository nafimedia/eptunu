import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hashPassword } from '../../services/hash';

const db = prisma as any;

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  prodi: z.string().optional().nullable(),
  faculty: z.string().optional().nullable(),
});

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. UPDATE USER PROFILE (Self)
  fastify.put('/profile', async (request, reply) => {
    const userId = request.user?.userId;
    const body = updateProfileSchema.parse(request.body);

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        fullName: body.fullName,
        prodi: body.prodi,
        faculty: body.faculty,
      },
    });

    return reply.send({
      success: true,
      message: 'Profil berhasil diperbarui!',
      user: updatedUser,
    });
  });

  // 2. LIST USERS WITH PAGINATION & FILTERS
  fastify.get('/', async (request, reply) => {
    const userRole = request.user?.role || '';
    const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE'];
    if (!allowed.includes(userRole)) {
      return reply.status(403).send({ success: false, message: 'Akses ditolak' });
    }

    const { search, role, page = '1', limit = '10' } = request.query as any;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { identityNumber: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          identityNumber: true,
          fullName: true,
          email: true,
          role: true,
          prodi: true,
          faculty: true,
          createdAt: true,
        },
      }),
      db.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  });

  // 3. CREATE NEW USER (Admin)
  fastify.post('/', async (request, reply) => {
    const userRole = request.user?.role || '';
    const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'];
    if (!allowed.includes(userRole)) {
      return reply.status(403).send({ success: false, message: 'Akses ditolak' });
    }

    const { identityNumber, fullName, email, password, role, prodi, faculty } = request.body as any;

    if (!identityNumber || !fullName || !email || !password) {
      return reply.status(400).send({ success: false, message: 'NIM/NIP, Nama, Email, dan Password wajib diisi' });
    }

    // Check unique NIM/NIP & email
    const existing = await db.user.findFirst({
      where: { OR: [{ identityNumber }, { email }] },
    });
    if (existing) {
      return reply.status(400).send({ success: false, message: 'NIM/NIP atau Email sudah terdaftar' });
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        identityNumber,
        fullName,
        email,
        passwordHash,
        role: role || 'STUDENT',
        prodi,
        faculty,
      },
    });

    return reply.status(201).send({ success: true, message: 'Pengguna berhasil dibuat', data: user });
  });

  // 4. UPDATE USER DETAILS (Admin)
  fastify.put('/:id', async (request, reply) => {
    const userRole = request.user?.role || '';
    const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'];
    if (!allowed.includes(userRole)) {
      return reply.status(403).send({ success: false, message: 'Akses ditolak' });
    }

    const { id } = request.params as { id: string };
    const { fullName, email, role, prodi, faculty } = request.body as any;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        fullName: fullName || user.fullName,
        email: email || user.email,
        role: role || user.role,
        prodi: prodi !== undefined ? prodi : user.prodi,
        faculty: faculty !== undefined ? faculty : user.faculty,
      },
    });

    return reply.send({ success: true, message: 'Data pengguna berhasil diperbarui', data: updatedUser });
  });

  // 5. RESET USER PASSWORD (Admin)
  fastify.post('/:id/reset-password', async (request, reply) => {
    const userRole = request.user?.role || '';
    const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'];
    if (!allowed.includes(userRole)) {
      return reply.status(403).send({ success: false, message: 'Akses ditolak' });
    }

    const { id } = request.params as { id: string };
    const { newPassword = 'password123' } = (request.body as any) || {};

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const passwordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id },
      data: { passwordHash },
    });

    return reply.send({
      success: true,
      message: `Password pengguna ${user.fullName} berhasil di-reset ke '${newPassword}'`,
    });
  });

  // 6. DELETE USER (Admin)
  fastify.delete('/:id', async (request, reply) => {
    const userRole = request.user?.role || '';
    const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'];
    if (!allowed.includes(userRole)) {
      return reply.status(403).send({ success: false, message: 'Akses ditolak' });
    }

    const { id } = request.params as { id: string };

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    await db.user.delete({ where: { id } });

    return reply.send({ success: true, message: `Pengguna ${user.fullName} berhasil dihapus` });
  });
}
