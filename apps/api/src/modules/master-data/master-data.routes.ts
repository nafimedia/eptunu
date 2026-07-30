import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';

const db = prisma as any;

export async function masterDataRoutes(fastify: FastifyInstance) {
  // -------------------------------------------------------------
  // 1. FAKULTAS (FACULTIES)
  // -------------------------------------------------------------
  fastify.get('/faculties', async (request, reply) => {
    const data = await db.faculty.findMany({
      include: { studyPrograms: true },
      orderBy: { code: 'asc' },
    });
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------
  // 2. PROGRAM STUDI (STUDY PROGRAMS)
  // -------------------------------------------------------------
  fastify.get('/study-programs', async (request, reply) => {
    const data = await db.studyProgram.findMany({
      include: { faculty: true },
      orderBy: { code: 'asc' },
    });
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------
  // 3. INSTANSI (INSTITUTIONS)
  // -------------------------------------------------------------
  fastify.get('/institutions', async (request, reply) => {
    const data = await db.institution.findMany({
      orderBy: { isInternal: 'desc' },
    });
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------
  // 4. JENIS PESERTA (PARTICIPANT TYPES)
  // -------------------------------------------------------------
  fastify.get('/participant-types', async (request, reply) => {
    const data = await db.participantType.findMany({
      orderBy: { code: 'asc' },
    });
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------
  // 5. TAHUN AKADEMIK (ACADEMIC YEARS)
  // -------------------------------------------------------------
  fastify.get('/academic-years', async (request, reply) => {
    const data = await db.academicYear.findMany({
      orderBy: { code: 'desc' },
    });
    return reply.send({ success: true, data });
  });

  // PROTECTED WRITE OPERATIONS (Super Admin & Admin EPT)
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);
    protectedRoutes.addHook('preHandler', hasRole(['SUPER_ADMIN', 'ADMIN_EPT']));

    // Create Faculty
    protectedRoutes.post('/faculties', async (request, reply) => {
      const { code, name, description } = request.body as any;
      if (!code || !name) return reply.status(400).send({ success: false, message: 'Kode dan Nama Fakultas wajib diisi' });

      const item = await db.faculty.create({
        data: { code, name, description },
      });
      return reply.status(201).send({ success: true, message: 'Fakultas berhasil ditambahkan', data: item });
    });

    // Delete Faculty (with cascade delete for child study programs)
    protectedRoutes.delete('/faculties/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.studyProgram.deleteMany({ where: { facultyId: id } });
      await db.faculty.delete({ where: { id } });
      return reply.send({ success: true, message: 'Fakultas beserta program studi di dalamnya berhasil dihapus' });
    });

    // Create Study Program
    protectedRoutes.post('/study-programs', async (request, reply) => {
      const { code, name, facultyId } = request.body as any;
      if (!code || !name || !facultyId) return reply.status(400).send({ success: false, message: 'Kode, Nama Prodi, dan Fakultas wajib diisi' });

      const item = await db.studyProgram.create({
        data: { code, name, facultyId },
      });
      return reply.status(201).send({ success: true, message: 'Program Studi berhasil ditambahkan', data: item });
    });

    // Delete Study Program
    protectedRoutes.delete('/study-programs/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.studyProgram.delete({ where: { id } });
      return reply.send({ success: true, message: 'Program Studi berhasil dihapus' });
    });

    // Create Institution
    protectedRoutes.post('/institutions', async (request, reply) => {
      const { code, name, isInternal = true } = request.body as any;
      if (!code || !name) return reply.status(400).send({ success: false, message: 'Kode dan Nama Instansi wajib diisi' });

      const item = await db.institution.create({
        data: { code, name, isInternal },
      });
      return reply.status(201).send({ success: true, message: 'Instansi berhasil ditambahkan', data: item });
    });

    // Delete Institution
    protectedRoutes.delete('/institutions/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.institution.delete({ where: { id } });
      return reply.send({ success: true, message: 'Instansi berhasil dihapus' });
    });

    // Create Participant Type
    protectedRoutes.post('/participant-types', async (request, reply) => {
      const { code, name, description } = request.body as any;
      if (!code || !name) return reply.status(400).send({ success: false, message: 'Kode dan Nama Jenis Peserta wajib diisi' });

      const item = await db.participantType.create({
        data: { code, name, description },
      });
      return reply.status(201).send({ success: true, message: 'Jenis Peserta berhasil ditambahkan', data: item });
    });

    // Delete Participant Type
    protectedRoutes.delete('/participant-types/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.participantType.delete({ where: { id } });
      return reply.send({ success: true, message: 'Jenis Peserta berhasil dihapus' });
    });

    // Create Academic Year
    protectedRoutes.post('/academic-years', async (request, reply) => {
      const { code, name, isCurrent = false } = request.body as any;
      if (!code || !name) return reply.status(400).send({ success: false, message: 'Kode dan Nama Tahun Akademik wajib diisi' });

      if (isCurrent) {
        await db.academicYear.updateMany({ data: { isCurrent: false } });
      }

      const item = await db.academicYear.create({
        data: { code, name, isCurrent },
      });
      return reply.status(201).send({ success: true, message: 'Tahun Akademik berhasil ditambahkan', data: item });
    });

    // Toggle Active Academic Year
    protectedRoutes.put('/academic-years/:id/set-current', async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.academicYear.updateMany({ data: { isCurrent: false } });
      const item = await db.academicYear.update({
        where: { id },
        data: { isCurrent: true },
      });
      return reply.send({ success: true, message: `Tahun Akademik '${item.name}' diaktifkan`, data: item });
    });

    // Delete Academic Year
    protectedRoutes.delete('/academic-years/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.academicYear.delete({ where: { id } });
      return reply.send({ success: true, message: 'Tahun Akademik berhasil dihapus' });
    });
  });
}
