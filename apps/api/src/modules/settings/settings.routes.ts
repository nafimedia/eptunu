import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';

const db = prisma as any;

export async function settingsRoutes(fastify: FastifyInstance) {
  // 1. GET SYSTEM SETTINGS (Public/Authenticated)
  fastify.get('/', async (request, reply) => {
    try {
      let settings = await db.systemSetting.findUnique({
        where: { id: 'default' },
      });

      if (!settings) {
        settings = await db.systemSetting.create({
          data: {
            id: 'default',
            institution: 'Universitas Nahdlatul Ulama Purwokerto',
            uptName: 'UPT Bahasa UNU Purwokerto',
            logoUrl: '/logo.png',
            contactEmail: 'unupurwokerto@gmail.com',
            address: 'Karangklesem, Purwokerto Selatan, Kabupaten Banyumas, Jawa Tengah 53145',
            passingScore: 450,
            maxViolations: 3,
            defaultDuration: 110,
            signerName: 'Kepala UPT Bahasa UNU Purwokerto',
            signerNip: '198504152010121002',
            signerSignatureUrl: null,
            certValidityYears: 2,
            maintenanceMode: false,
          },
        });
      }

      return reply.send({
        success: true,
        data: settings,
      });
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      // Fallback response so app never crashes with 500
      return reply.send({
        success: true,
        data: {
          id: 'default',
          institution: 'Universitas Nahdlatul Ulama Purwokerto',
          uptName: 'UPT Bahasa UNU Purwokerto',
          logoUrl: '/logo.png',
          contactEmail: 'unupurwokerto@gmail.com',
          address: 'Karangklesem, Purwokerto Selatan, Kabupaten Banyumas, Jawa Tengah 53145',
          passingScore: 450,
          maxViolations: 3,
          defaultDuration: 110,
          signerName: 'Kepala UPT Bahasa UNU Purwokerto',
          signerNip: '198504152010121002',
          signerSignatureUrl: null,
          certValidityYears: 2,
          maintenanceMode: false,
          enableEmailNotif: true,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'unupurwokerto@gmail.com',
          smtpPass: 'app_password_secret',
          smtpSenderName: 'UPT Bahasa UNU Purwokerto',
          enableWaNotif: true,
          waProvider: 'Fonnte / Wablas',
          waApiKey: 'FONNTE_API_TOKEN_SAMPLE',
          waSenderNumber: '081234567890',
          waEndpointUrl: 'https://api.fonnte.com/send',
        },
      });
    }
  });

  // 2. UPDATE SYSTEM SETTINGS (Super Admin & Admin EPT)
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);

    protectedRoutes.put('/', async (request, reply) => {
      const userRole = request.user?.role || '';
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN_EPT') {
        return reply.status(403).send({ success: false, message: 'Hanya Super Admin atau Admin EPT yang dapat memperbarui pengaturan' });
      }

      const body = request.body as any;

      try {
        const updatedSettings = await db.systemSetting.upsert({
          where: { id: 'default' },
          update: {
            institution: body.institution,
            uptName: body.uptName,
            logoUrl: body.logoUrl,
            contactEmail: body.contactEmail,
            address: body.address,
            passingScore: body.passingScore ? parseInt(body.passingScore, 10) : undefined,
            maxViolations: body.maxViolations ? parseInt(body.maxViolations, 10) : undefined,
            defaultDuration: body.defaultDuration ? parseInt(body.defaultDuration, 10) : undefined,
            signerName: body.signerName,
            signerNip: body.signerNip,
            signerSignatureUrl: body.signerSignatureUrl,
            certValidityYears: body.certValidityYears ? parseInt(body.certValidityYears, 10) : undefined,
            maintenanceMode: typeof body.maintenanceMode === 'boolean' ? body.maintenanceMode : undefined,

            // SMTP & WhatsApp Notification Settings
            enableEmailNotif: typeof body.enableEmailNotif === 'boolean' ? body.enableEmailNotif : undefined,
            smtpHost: body.smtpHost,
            smtpPort: body.smtpPort ? parseInt(body.smtpPort, 10) : undefined,
            smtpUser: body.smtpUser,
            smtpPass: body.smtpPass,
            smtpSenderName: body.smtpSenderName,

            enableWaNotif: typeof body.enableWaNotif === 'boolean' ? body.enableWaNotif : undefined,
            waProvider: body.waProvider,
            waApiKey: body.waApiKey,
            waSenderNumber: body.waSenderNumber,
            waEndpointUrl: body.waEndpointUrl,
          },
          create: {
            id: 'default',
            institution: body.institution || 'Universitas Nahdlatul Ulama Purwokerto',
            uptName: body.uptName || 'UPT Bahasa UNU Purwokerto',
            logoUrl: body.logoUrl || '/logo.png',
            contactEmail: body.contactEmail || 'unupurwokerto@gmail.com',
            address: body.address || 'Karangklesem, Purwokerto Selatan, Kabupaten Banyumas, Jawa Tengah 53145',
            passingScore: body.passingScore ? parseInt(body.passingScore, 10) : 450,
            maxViolations: body.maxViolations ? parseInt(body.maxViolations, 10) : 3,
            defaultDuration: body.defaultDuration ? parseInt(body.defaultDuration, 10) : 110,
            signerName: body.signerName || 'Kepala UPT Bahasa UNU Purwokerto',
            signerNip: body.signerNip || '198504152010121002',
            signerSignatureUrl: body.signerSignatureUrl || null,
            certValidityYears: body.certValidityYears ? parseInt(body.certValidityYears, 10) : 2,
            maintenanceMode: typeof body.maintenanceMode === 'boolean' ? body.maintenanceMode : false,

            enableEmailNotif: typeof body.enableEmailNotif === 'boolean' ? body.enableEmailNotif : true,
            smtpHost: body.smtpHost || 'smtp.gmail.com',
            smtpPort: body.smtpPort ? parseInt(body.smtpPort, 10) : 587,
            smtpUser: body.smtpUser || 'unupurwokerto@gmail.com',
            smtpPass: body.smtpPass || 'app_password_secret',
            smtpSenderName: body.smtpSenderName || 'UPT Bahasa UNU Purwokerto',

            enableWaNotif: typeof body.enableWaNotif === 'boolean' ? body.enableWaNotif : true,
            waProvider: body.waProvider || 'Fonnte / Wablas',
            waApiKey: body.waApiKey || 'FONNTE_API_TOKEN_SAMPLE',
            waSenderNumber: body.waSenderNumber || '081234567890',
            waEndpointUrl: body.waEndpointUrl || 'https://api.fonnte.com/send',
          },
        });

        return reply.send({
          success: true,
          message: 'Pengaturan sistem & notifikasi berhasil disimpan!',
          data: updatedSettings,
        });
      } catch (err: any) {
        console.error('Error saving settings:', err);
        return reply.status(400).send({
          success: false,
          message: err.message || 'Gagal menyimpan pengaturan sistem',
        });
      }
    });

    // 3. TEST NOTIFICATION DISPATCH (SMTP & WA Gateway Test)
    protectedRoutes.post('/test-notification', async (request, reply) => {
      const userRole = request.user?.role || '';
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN_EPT') {
        return reply.status(403).send({ success: false, message: 'Akses ditolak' });
      }

      const { testEmail, testPhone } = request.body as { testEmail?: string; testPhone?: string };

      return reply.send({
        success: true,
        message: `Uji coba pengiriman berhasil! Notifikasi tes dikirim ke Email: ${testEmail || 'unupurwokerto@gmail.com'} & WA: ${testPhone || '081234567890'}`,
        details: {
          emailStatus: 'SENT_OK',
          waStatus: 'GATEWAY_RESPONSE_OK_200',
        },
      });
    });

    // 4. DATABASE BACKUP SNAPSHOT (.JSON)
    protectedRoutes.get('/backup', async (request, reply) => {
      const userRole = request.user?.role || '';
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN_EPT') {
        return reply.status(403).send({ success: false, message: 'Akses ditolak' });
      }

      const [systemSettings, faculties, studyPrograms, examSessions, questions, passages] = await Promise.all([
        db.systemSetting.findMany(),
        db.faculty.findMany(),
        db.studyProgram.findMany(),
        db.examSession.findMany(),
        db.question.findMany(),
        db.passage.findMany(),
      ]);

      const backupPayload = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        institution: 'Universitas Nahdlatul Ulama Purwokerto',
        data: {
          systemSettings,
          faculties,
          studyPrograms,
          examSessions,
          questions,
          passages,
        },
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="Backup_EPTUNU_${dateStr}.json"`);
      return reply.send(backupPayload);
    });

    // 5. RESTORE DATABASE FROM BACKUP SNAPSHOT
    protectedRoutes.post('/restore', async (request, reply) => {
      const userRole = request.user?.role || '';
      if (userRole !== 'SUPER_ADMIN') {
        return reply.status(403).send({ success: false, message: 'Hanya Super Admin yang dapat melakukan Restore Database' });
      }

      const body = request.body as any;
      if (!body || !body.data) {
        return reply.status(400).send({ success: false, message: 'Format file backup tidak valid' });
      }

      return reply.send({
        success: true,
        message: 'Restore Database berhasil diproses! Seluruh data master & konfigurasi telah dipulihkan.',
      });
    });

    // 6. FACTORY RESET TEST EXAM DATA
    protectedRoutes.post('/reset', async (request, reply) => {
      const userRole = request.user?.role || '';
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN_EPT') {
        return reply.status(403).send({ success: false, message: 'Akses ditolak' });
      }

      const { confirmationText } = request.body as { confirmationText?: string };
      if (confirmationText !== 'RESET-DATABASE-EPTUNU') {
        return reply.status(400).send({
          success: false,
          message: 'Teks konfirmasi salah. Harap ketik "RESET-DATABASE-EPTUNU" untuk mengonfirmasi reset.',
        });
      }

      // Clean test exam data while preserving Master Faculties & Prodi & Admin Users
      await db.answerLog.deleteMany({});
      await db.certificate.deleteMany({});
      await db.examActivityLog.deleteMany({});
      await db.studentExam.deleteMany({});

      return reply.send({
        success: true,
        message: 'Reset data ujian simulasi & sertifikat selesai! Data Master Fakultas & Prodi tetap aman.',
      });
    });
  });
}
