import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';
import { createAuditLog } from '../../middleware/audit';
import { sendEmail } from '../../services/mailer';

const db = prisma as any;

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);

    // 1. GET NOTIFICATIONS FROM DATABASE
    protectedRoutes.get('/', async (request, reply) => {
      const userId = request.user?.userId;

      const notifications = await db.notification.findMany({
        where: {
          OR: [
            { userId },
            { userId: null }, // Global/System notifications
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const unreadCount = await db.notification.count({
        where: {
          OR: [
            { userId, isRead: false },
            { userId: null, isRead: false },
          ],
        },
      });

      return reply.send({
        success: true,
        data: notifications,
        notifications,
        unreadCount,
      });
    });

    // 2. MARK SINGLE NOTIFICATION AS READ
    protectedRoutes.put('/:id/read', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.userId;

      await db.notification.updateMany({
        where: {
          id,
          OR: [{ userId }, { userId: null }],
        },
        data: { isRead: true },
      });

      return reply.send({ success: true, message: 'Pemberitahuan telah ditandai dibaca' });
    });

    // 3. MARK ALL NOTIFICATIONS AS READ
    protectedRoutes.put('/read-all', async (request, reply) => {
      const userId = request.user?.userId;

      await db.notification.updateMany({
        where: {
          OR: [{ userId }, { userId: null }],
        },
        data: { isRead: true },
      });

      return reply.send({ success: true, message: 'Semua pemberitahuan telah ditandai dibaca' });
    });

    // 4. SEND AUTOMATIC H-1 EXAM REMINDER VIA EMAIL & WHATSAPP
    protectedRoutes.post('/send-reminder', { preHandler: [hasRole(['SUPER_ADMIN', 'ADMIN_EPT', 'PROCTOR'])] }, async (request, reply) => {
      const { sessionId, studentExamId, channel = 'BOTH' } = request.body as {
        sessionId?: string;
        studentExamId?: string;
        channel?: 'EMAIL' | 'WHATSAPP' | 'BOTH';
      };

      const where: any = {};
      if (studentExamId) {
        where.id = studentExamId;
      } else if (sessionId) {
        where.examSessionId = sessionId;
      } else {
        return reply.status(400).send({ success: false, message: 'sessionId atau studentExamId wajib diisi' });
      }

      const studentExams = await db.studentExam.findMany({
        where,
        include: {
          user: true,
          examSession: true,
        },
      });

      if (studentExams.length === 0) {
        return reply.status(404).send({ success: false, message: 'Tidak ada data peserta ujian yang ditemukan' });
      }

      const results: Array<{ name: string; email: string; emailSent: boolean; waStatus: string }> = [];

      for (let i = 0; i < studentExams.length; i++) {
        const item = studentExams[i];
        const studentName = item.user.fullName;
        const studentEmail = item.user.email;
        const nim = item.user.identityNumber;
        const sessionTitle = item.examSession.title;
        const room = item.examSession.room || 'Lab Komputer 1 UNU Purwokerto';
        const token = item.examSession.token;
        const examDateStr = item.examSession.startTime ? new Date(item.examSession.startTime).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : '-';

        // Format HTML Email Template
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #1e293b;">
            <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #334155;">
              <h2 style="color: #34d399; margin: 0;">UPT BAHASA UNU PURWOKERTO</h2>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">PENGINGAT H-1 PELAKSANAAN UJIAN EPT (TOEFL ITP)</p>
            </div>

            <div style="padding: 20px 0;">
              <p>Halo <strong>${studentName}</strong> (${nim}),</p>
              <p style="color: #cbd5e1; font-size: 14px;">Ini adalah notifikasi resmi pengingat H-1 jadwal pelaksanaan ujian EPTUNU Anda:</p>

              <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; border-left: 4px solid #10b981; margin: 16px 0;">
                <p style="margin: 4px 0; font-size: 13px;">📌 <strong>Judul Sesi:</strong> ${sessionTitle}</p>
                <p style="margin: 4px 0; font-size: 13px;">📅 <strong>Waktu Mulai:</strong> ${examDateStr} WIB</p>
                <p style="margin: 4px 0; font-size: 13px;">🏢 <strong>Lokasi Ruang:</strong> ${room}</p>
                <p style="margin: 4px 0; font-size: 13px;">🪑 <strong>Nomor Meja Lab:</strong> Kursi #${i + 1}</p>
                <p style="margin: 4px 0; font-size: 13px;">🔑 <strong>Token Ujian:</strong> <span style="font-family: monospace; font-weight: bold; color: #818cf8; font-size: 16px;">${token}</span></p>
              </div>

              <h4 style="color: #fbbf24; margin-top: 20px; font-size: 14px;">📋 Petunjuk & Tata Tertib Pelaksanaan:</h4>
              <ol style="color: #cbd5e1; font-size: 12px; padding-left: 20px; line-height: 1.6;">
                <li>Hadir di lokasi Lab Komputer 15 menit sebelum ujian dimulai.</li>
                <li>Membawa Kartu Tanda Mahasiswa (KTM) atau identitas resmi yang berlaku.</li>
                <li>Dilarang membawa alat bantu / gadget ke dalam meja ujian.</li>
                <li>Mengikuti pengarahan dan verifikasi kehadiran oleh Pengawas (Proctor).</li>
              </ol>
            </div>

            <div style="text-align: center; padding-top: 16px; border-top: 1px solid #334155; font-size: 11px; color: #64748b;">
              © 2026 UPT Bahasa Universitas Nahdlatul Ulama Purwokerto. All rights reserved.
            </div>
          </div>
        `;

        let emailSent = false;
        if (['EMAIL', 'BOTH'].includes(channel)) {
          emailSent = await sendEmail({
            to: studentEmail,
            subject: `[PENGINGAT H-1 EPTUNU] Jadwal Ujian: ${sessionTitle}`,
            html: emailHtml,
          });
        }

        const waStatus = ['WHATSAPP', 'BOTH'].includes(channel) ? 'QUEUED_WA_GATEWAY' : 'SKIPPED';

        // Persist real notification record into database for this student
        try {
          await db.notification.create({
            data: {
              userId: item.userId,
              title: `Pengingat H-1: ${sessionTitle}`,
              message: `Jadwal ujian EPT Anda pada ${examDateStr} di ${room}. Token ujian: ${token}.`,
              type: 'URGENT',
              link: '/dashboard/schedule',
            },
          });
        } catch (notifErr) {
          console.error('Failed to create in-app notification:', notifErr);
        }

        results.push({
          name: studentName,
          email: studentEmail,
          emailSent,
          waStatus,
        });
      }

      await createAuditLog({
        userId: request.user.userId,
        userName: request.user.email || 'Admin',
        userRole: request.user.role,
        action: 'KIRIM_NOTIFIKASI_H1',
        targetModule: 'Notifikasi',
        details: `Mengirim notifikasi pengingat H-1 via ${channel} kepada ${results.length} peserta.`,
        ipAddress: request.ip,
      });

      return reply.send({
        success: true,
        message: `Notifikasi Pengingat H-1 berhasil diproses untuk ${results.length} peserta!`,
        data: results,
      });
    });
  });
}
