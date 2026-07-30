import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';

const db = prisma as any;

function generateRandomToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function examSessionsRoutes(fastify: FastifyInstance) {
  // Public / Student View: Get Active Schedules
  fastify.get('/active', async (request, reply) => {
    const sessions = await db.examSession.findMany({
      where: { isActive: true },
      include: {
        proctor: { select: { id: true, fullName: true, email: true } },
        _count: { select: { studentExams: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return reply.send({ success: true, data: sessions });
  });

  // Protected Routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);
    protectedRoutes.addHook('preHandler', hasRole(['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE', 'STUDENT']));

    // Get all schedules
    protectedRoutes.get('/', async (request, reply) => {
      const userRole = request.user?.role || '';
      const userId = request.user?.userId;

      if (userRole === 'STUDENT') {
        const studentExams = await db.studentExam.findMany({
          where: { userId },
          include: {
            examSession: {
              include: {
                proctor: { select: { id: true, fullName: true } },
                _count: { select: { studentExams: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const activeSessions = await db.examSession.findMany({
          where: { isActive: true },
          include: {
            proctor: { select: { id: true, fullName: true } },
            _count: { select: { studentExams: true } },
          },
          orderBy: { startTime: 'asc' },
        });

        return reply.send({
          success: true,
          data: activeSessions,
          studentExams,
          proctors: [],
        });
      }

      const sessions = await db.examSession.findMany({
        include: {
          proctor: { select: { id: true, fullName: true, email: true } },
          _count: { select: { studentExams: true } },
        },
        orderBy: { startTime: 'desc' },
      });

      // Get proctors list for assignment dropdowns
      const proctors = await db.user.findMany({
        where: { role: { in: ['PROCTOR', 'ADMIN_EPT', 'SUPER_ADMIN'] } },
        select: { id: true, fullName: true, role: true },
      });

      return reply.send({ success: true, data: sessions, proctors });
    });

    // Create New Exam Session Schedule
    protectedRoutes.post('/', async (request, reply) => {
      const userRole = request.user?.role || '';
      if (!['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'].includes(userRole)) {
        return reply.status(403).send({ success: false, message: 'Akses ditolak' });
      }

      const {
        title,
        token = generateRandomToken(),
        startTime,
        endTime,
        durationMin = 110,
        room = 'Lab Komputer UNU Purwokerto',
        quota = 35,
        proctorId,
        isActive = true,
      } = request.body as any;

      if (!title || !startTime || !endTime) {
        return reply.status(400).send({ success: false, message: 'Judul Ujian, Waktu Mulai, dan Waktu Selesai wajib diisi' });
      }

      const session = await db.examSession.create({
        data: {
          title,
          token: token.toUpperCase(),
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          durationMin: parseInt(durationMin, 10),
          room,
          quota: parseInt(quota, 10),
          proctorId: proctorId || null,
          isActive,
        },
      });

      return reply.status(201).send({
        success: true,
        message: `Jadwal Ujian '${session.title}' berhasil dibuat`,
        data: session,
      });
    });

    // Update Exam Session Schedule
    protectedRoutes.put('/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const existing = await db.examSession.findUnique({ where: { id } });
      if (!existing) return reply.status(404).send({ success: false, message: 'Jadwal Ujian tidak ditemukan' });

      const updated = await db.examSession.update({
        where: { id },
        data: {
          title: body.title || existing.title,
          token: body.token ? body.token.toUpperCase() : existing.token,
          startTime: body.startTime ? new Date(body.startTime) : existing.startTime,
          endTime: body.endTime ? new Date(body.endTime) : existing.endTime,
          durationMin: body.durationMin ? parseInt(body.durationMin, 10) : existing.durationMin,
          room: body.room !== undefined ? body.room : existing.room,
          quota: body.quota ? parseInt(body.quota, 10) : existing.quota,
          proctorId: body.proctorId !== undefined ? body.proctorId : existing.proctorId,
          isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        },
      });

      return reply.send({ success: true, message: 'Jadwal Ujian berhasil diperbarui', data: updated });
    });

    // Regenerate 6-character Dynamic Token
    protectedRoutes.put('/:id/generate-token', async (request, reply) => {
      const { id } = request.params as { id: string };
      const newToken = generateRandomToken();

      const updated = await db.examSession.update({
        where: { id },
        data: { token: newToken },
      });

      return reply.send({
        success: true,
        message: `Token Ujian diperbarui menjadi '${newToken}'`,
        token: newToken,
        data: updated,
      });
    });

    // Manually Start Exam Session (Admin & Proctor)
    protectedRoutes.put('/:id/start-session', async (request, reply) => {
      const { id } = request.params as { id: string };

      const session = await db.examSession.findUnique({ where: { id } });
      if (!session) {
        return reply.status(404).send({ success: false, message: 'Jadwal Ujian tidak ditemukan' });
      }

      const now = new Date();
      const durationMs = (session.durationMin || 110) * 60 * 1000;
      const endTime = new Date(now.getTime() + durationMs);
      const newToken = generateRandomToken();

      const updated = await db.examSession.update({
        where: { id },
        data: {
          isActive: true,
          token: newToken,
          startTime: now,
          endTime,
        },
      });

      return reply.send({
        success: true,
        message: `Sesi Ujian '${session.title}' berhasil DIMULAI secara manual! Token Aktif: ${newToken}`,
        data: updated,
      });
    });

    // Manually Stop/End Exam Session (Admin & Proctor)
    protectedRoutes.put('/:id/stop-session', async (request, reply) => {
      const { id } = request.params as { id: string };

      const session = await db.examSession.findUnique({ where: { id } });
      if (!session) {
        return reply.status(404).send({ success: false, message: 'Jadwal Ujian tidak ditemukan' });
      }

      const updated = await db.examSession.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      return reply.send({
        success: true,
        message: `Sesi Ujian '${session.title}' telah DIHENTIKAN secara manual.`,
        data: updated,
      });
    });

    // Delete Exam Session Schedule
    protectedRoutes.delete('/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.examSession.delete({ where: { id } });
      return reply.send({ success: true, message: 'Jadwal Ujian berhasil dihapus' });
    });
  });
}
