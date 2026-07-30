import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@starter-kit/database';
import { hashPassword, comparePassword } from '../../services/hash';
import { authenticate } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';
import { addEmailJob } from '../../services/queue';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export async function authRoutes(fastify: FastifyInstance) {
  // 1. LOGIN
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({
        success: false,
        message: 'Email atau password salah, atau akun Anda belum aktif.',
      });
    }

    const { isValid, needsRehash } = await comparePassword(body.password, user.passwordHash);

    if (!isValid) {
      return reply.status(401).send({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Auto-upgrade legacy SHA256 password hash to Argon2id
    if (needsRehash) {
      const newArgon2Hash = await hashPassword(body.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newArgon2Hash },
      });
      request.log.info(`Password hash for user ${user.email} successfully upgraded to Argon2id`);
    }

    const permissions = user.role.permissions.map((rp: any) => rp.permission.name);

    const accessToken = fastify.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        permissions,
      },
      { expiresIn: '1d' }
    );

    const refreshToken = fastify.jwt.sign(
      { userId: user.id },
      { expiresIn: '7d' }
    );

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'Auth',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    // Set Refresh Token in HttpOnly cookie
    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.send({
      success: true,
      message: 'Login berhasil!',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions,
        avatarUrl: user.avatarUrl,
      },
    });
  });

  // 2. REGISTER
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.status(400).send({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
      });
    }

    const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (!userRole) {
      return reply.status(500).send({ success: false, message: 'Role default USER tidak ditemukan' });
    }

    const newPasswordHash = await hashPassword(body.password);

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: newPasswordHash,
        roleId: userRole.id,
      },
    });

    await addEmailJob('send-welcome', { email: body.email, name: body.name });

    await createAuditLog({
      userId: newUser.id,
      action: 'USER_REGISTER',
      entity: 'Auth',
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Pendaftaran akun berhasil! Silakan login.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  });

  // 3. REFRESH TOKEN ROTATION
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken || (request.body as any)?.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ success: false, message: 'Refresh token tidak ditemukan' });
    }

    try {
      const decoded = fastify.jwt.verify<{ userId: string }>(refreshToken);
      const storedToken = await prisma.refreshToken.findFirst({
        where: { token: refreshToken, userId: decoded.userId },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return reply.status(401).send({ success: false, message: 'Refresh token kadaluarsa atau tidak valid' });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({ success: false, message: 'Pengguna tidak aktif' });
      }

      const permissions = user.role.permissions.map((rp: any) => rp.permission.name);

      const newAccessToken = fastify.jwt.sign(
        {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
          permissions,
        },
        { expiresIn: '1d' }
      );

      return reply.send({
        success: true,
        token: newAccessToken,
      });
    } catch (err) {
      return reply.status(401).send({ success: false, message: 'Refresh token tidak valid' });
    }
  });

  // 4. LOGOUT
  fastify.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    const refreshToken = request.cookies.refreshToken || (request.body as any)?.refreshToken;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    reply.clearCookie('refreshToken', { path: '/' });

    return reply.send({ success: true, message: 'Logout berhasil' });
  });

  // 5. GET CURRENT USER (ME)
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const permissions = user.role.permissions.map((rp: any) => rp.permission.name);

    return reply.send({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  });
}
