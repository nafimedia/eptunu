import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middleware/auth';

const db = prisma as any;

function generateRegistrationNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `REG/${year}/${month}/${randomNum}`;
}

export async function registrationsRoutes(fastify: FastifyInstance) {
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);

    // 1. Student Registers to Exam Session
    protectedRoutes.post('/', async (request, reply) => {
      const userId = request.user?.userId;
      const { examSessionId, paymentProofUrl } = request.body as { examSessionId: string; paymentProofUrl?: string };

      if (!examSessionId) {
        return reply.status(400).send({ success: false, message: 'ID Sesi Ujian wajib dipilih' });
      }

      const session = await db.examSession.findUnique({
        where: { id: examSessionId },
        include: { _count: { select: { studentExams: true } } },
      });

      if (!session || !session.isActive) {
        return reply.status(400).send({ success: false, message: 'Sesi Ujian tidak aktif atau tidak ditemukan' });
      }

      // Check Quota
      if ((session._count?.studentExams || 0) >= session.quota) {
        return reply.status(400).send({ success: false, message: 'Kuota pendaftaran untuk sesi ujian ini sudah penuh' });
      }

      // Check Existing Registration
      const existing = await db.studentExam.findUnique({
        where: {
          userId_examSessionId: {
            userId: userId!,
            examSessionId,
          },
        },
      });

      if (existing) {
        return reply.status(400).send({ success: false, message: 'Anda sudah terdaftar pada sesi ujian ini' });
      }

      const regNo = generateRegistrationNo();
      const registration = await db.studentExam.create({
        data: {
          userId: userId!,
          examSessionId,
          status: 'SCHEDULED',
          verificationStatus: 'PENDING',
          registrationNo: regNo,
          paymentProofUrl: paymentProofUrl || null,
        },
        include: { examSession: true, user: true },
      });

      return reply.status(201).send({
        success: true,
        message: 'Pendaftaran ujian berhasil. Silakan unggah bukti pembayaran jika berbayar.',
        data: registration,
      });
    });

    // 2. Upload Payment Proof File
    protectedRoutes.post('/upload-payment', async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, message: 'File bukti pembayaran wajib diunggah' });
      }

      const paymentDir = path.resolve(__dirname, '../../../storage/payments');
      if (!fs.existsSync(paymentDir)) {
        fs.mkdirSync(paymentDir, { recursive: true });
      }

      const filename = `payment_${Date.now()}_${data.filename.replace(/\s+/g, '_')}`;
      const savePath = path.join(paymentDir, filename);

      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(savePath);
        data.file.pipe(writeStream);
        writeStream.on('finish', () => resolve(true));
        writeStream.on('error', reject);
      });

      const paymentProofUrl = `/storage/payments/${filename}`;

      return reply.send({
        success: true,
        message: 'File bukti pembayaran berhasil diunggah',
        paymentProofUrl,
      });
    });

    // 3. Get Student's Own Registrations
    protectedRoutes.get('/my-registrations', async (request, reply) => {
      const userId = request.user?.userId;
      const registrations = await db.studentExam.findMany({
        where: { userId: userId! },
        include: {
          examSession: {
            include: { proctor: { select: { fullName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, data: registrations });
    });

    // 4. Admin Operator View: List All Registrations with Filters
    protectedRoutes.get('/', async (request, reply) => {
      const userRole = request.user?.role || '';
      if (!['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE'].includes(userRole)) {
        return reply.status(403).send({ success: false, message: 'Akses ditolak' });
      }

      const { verificationStatus, examSessionId, search } = request.query as any;

      const where: any = {};
      if (verificationStatus) where.verificationStatus = verificationStatus;
      if (examSessionId) where.examSessionId = examSessionId;

      if (search) {
        where.OR = [
          { registrationNo: { contains: search } },
          { user: { fullName: { contains: search } } },
          { user: { identityNumber: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
      }

      const registrations = await db.studentExam.findMany({
        where,
        include: {
          user: { select: { id: true, identityNumber: true, fullName: true, email: true, prodi: true, faculty: true } },
          examSession: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, data: registrations });
    });

    // 5. Operator Admin Verification Workflow (VERIFIED / REJECTED)
    protectedRoutes.put('/:id/verify', async (request, reply) => {
      const userRole = request.user?.role || '';
      if (!['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'].includes(userRole)) {
        return reply.status(403).send({ success: false, message: 'Hanya Admin Operator EPT yang dapat memverifikasi berkas peserta' });
      }

      const { id } = request.params as { id: string };
      const { verificationStatus, verificationNotes } = request.body as {
        verificationStatus: 'VERIFIED' | 'REJECTED' | 'PENDING';
        verificationNotes?: string;
      };

      if (!verificationStatus || !['VERIFIED', 'REJECTED', 'PENDING'].includes(verificationStatus)) {
        return reply.status(400).send({ success: false, message: 'Status verifikasi tidak valid' });
      }

      const updated = await db.studentExam.update({
        where: { id },
        data: {
          verificationStatus,
          verificationNotes: verificationNotes || null,
        },
        include: { user: true, examSession: true },
      });

      return reply.send({
        success: true,
        message: `Pendaftaran peserta ${updated.user.fullName} berhasil diubah menjadi '${verificationStatus}'`,
        data: updated,
      });
    });

    // 6. Get Exam Participant Card Data (Kartu Ujian)
    protectedRoutes.get('/:id/card', async (request, reply) => {
      const { id } = request.params as { id: string };

      const studentExam = await db.studentExam.findUnique({
        where: { id },
        include: {
          user: true,
          examSession: {
            include: { proctor: { select: { fullName: true } } },
          },
        },
      });

      if (!studentExam) {
        return reply.status(404).send({ success: false, message: 'Data pendaftaran peserta tidak ditemukan' });
      }

      const systemSetting = (await db.systemSetting.findFirst()) || {
        institution: 'Universitas Nahdlatul Ulama Purwokerto',
        uptName: 'UPT Bahasa UNU Purwokerto',
        logoUrl: '/logo.png',
      };

      return reply.send({
        success: true,
        data: {
          registrationNo: studentExam.registrationNo || 'REG/2026/07/0001',
          identityNumber: studentExam.user.identityNumber,
          fullName: studentExam.user.fullName,
          email: studentExam.user.email,
          prodi: studentExam.user.prodi || 'Teknik Informatika',
          faculty: studentExam.user.faculty || 'Fakultas Sains dan Teknologi',
          sessionTitle: studentExam.examSession.title,
          token: studentExam.examSession.token,
          startTime: studentExam.examSession.startTime,
          endTime: studentExam.examSession.endTime,
          room: studentExam.examSession.room || 'Lab Komputer 1 UNU Purwokerto',
          proctorName: studentExam.examSession.proctor?.fullName || 'Pengawas UPT Bahasa',
          verificationStatus: studentExam.verificationStatus,
          institution: systemSetting.institution,
          uptName: systemSetting.uptName,
          qrCodeData: `EPTUNU-CARD:${studentExam.registrationNo}:${studentExam.user.identityNumber}`,
        },
      });
    });
  });
}
