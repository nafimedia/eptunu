import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import crypto from 'crypto';
import { authenticate } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';
import { hasRole } from '../../middleware/rbac';

export async function certificatesRoutes(fastify: FastifyInstance) {
  // Public Verification Endpoint (No authentication required)
  fastify.get('/verify/:certificateNo', async (request, reply) => {
    const { certificateNo } = request.params as { certificateNo: string };
    const decodedNo = decodeURIComponent(certificateNo).trim();

    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { certificateNo: decodedNo },
          { id: decodedNo }
        ]
      },
      include: {
        studentExam: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                identityNumber: true,
                prodi: true,
                faculty: true,
                email: true,
              },
            },
            examSession: {
              select: { title: true, startTime: true },
            },
          },
        },
      },
    });

    if (!cert) {
      return reply.status(404).send({
        success: false,
        message: 'Sertifikat tidak ditemukan. Harap periksa kembali nomor sertifikat.',
      });
    }

    const isExpired = new Date() > cert.validUntil;

    return reply.send({
      success: true,
      data: {
        id: cert.id,
        certificateNo: cert.certificateNo,
        issuedAt: cert.issuedAt,
        validUntil: cert.validUntil,
        signerName: cert.signerName,
        verificationHash: cert.verificationHash,
        isExpired,
        student: {
          fullName: cert.studentExam.user.fullName,
          identityNumber: cert.studentExam.user.identityNumber,
          prodi: cert.studentExam.user.prodi,
          faculty: cert.studentExam.user.faculty,
        },
        scores: {
          listening: cert.studentExam.scoreListening || 0,
          structure: cert.studentExam.scoreStructure || 0,
          reading: cert.studentExam.scoreReading || 0,
          total: cert.studentExam.totalScore || 0,
        },
        sessionTitle: cert.studentExam.examSession.title,
        examDate: cert.studentExam.examSession.startTime,
      },
    });
  });

  // Protected Certificate Endpoints
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);

    // List all certificates (Admin / Proctor / Executive)
    protectedRoutes.get('/', { preHandler: [hasRole(['SUPER_ADMIN', 'ADMIN_EPT', 'PROCTOR', 'EXECUTIVE'])] }, async (request, reply) => {
      const { search, limit = 50 } = request.query as any;

      const where: any = {};
      if (search) {
        where.OR = [
          { certificateNo: { contains: search } },
          { studentExam: { user: { fullName: { contains: search } } } },
          { studentExam: { user: { identityNumber: { contains: search } } } },
        ];
      }

      const certificates = await prisma.certificate.findMany({
        where,
        take: Number(limit),
        include: {
          studentExam: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  identityNumber: true,
                  prodi: true,
                  faculty: true,
                },
              },
              examSession: {
                select: { title: true, startTime: true },
              },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      });

      return reply.send({ success: true, data: certificates });
    });

    // Get My Certificates (Student)
    protectedRoutes.get('/my-certificates', async (request, reply) => {
      const userId = request.user.userId;

      const certificates = await prisma.certificate.findMany({
        where: {
          studentExam: { userId },
        },
        include: {
          studentExam: {
            include: {
              examSession: {
                select: { title: true, startTime: true },
              },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      });

      return reply.send({ success: true, data: certificates });
    });

    // Issue New Certificate (Admin / Proctor)
    protectedRoutes.post('/issue', async (request, reply) => {
      const userRole = request.user?.role || '';
      const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR'];
      if (!allowed.includes(userRole)) {
        return reply.status(403).send({ success: false, message: 'Akses ditolak' });
      }

      const { studentExamId } = request.body as { studentExamId: string };
      if (!studentExamId) {
        return reply.status(400).send({ success: false, message: 'studentExamId wajib diisi' });
      }

      const studentExam = await prisma.studentExam.findUnique({
        where: { id: studentExamId },
        include: {
          user: true,
          examSession: true,
          certificate: true,
        },
      });

      if (!studentExam) {
        return reply.status(404).send({ success: false, message: 'Data hasil ujian tidak ditemukan' });
      }

      if (studentExam.certificate) {
        return reply.send({
          success: true,
          message: 'Sertifikat sudah pernah diterbitkan',
          data: studentExam.certificate,
        });
      }

      // Fetch System Settings for signer & validity
      const settings = await prisma.systemSetting.findFirst() || {
        signerName: 'Kepala UPT Bahasa UNU Purwokerto',
        certValidityYears: 2,
      };

      const now = new Date();
      const validUntil = new Date();
      validUntil.setFullYear(now.getFullYear() + (settings.certValidityYears || 2));

      const count = await prisma.certificate.count();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const sequence = String(count + 1).padStart(4, '0');
      const certificateNo = `EPT/UNUPWT/${year}/${month}/${sequence}`;

      // Generate SHA-256 verification hash for authenticity
      const hashInput = `${certificateNo}|${studentExam.userId}|${studentExam.totalScore || 0}|${now.toISOString()}`;
      const verificationHash = crypto.createHash('sha256').update(hashInput).digest('hex');

      const pdfPath = `/storage/certificates/${certificateNo.replace(/\//g, '_')}.pdf`;

      const cert = await prisma.certificate.create({
        data: {
          certificateNo,
          studentExamId,
          issuedAt: now,
          validUntil,
          signerName: settings.signerName,
          verificationHash,
          pdfPath,
        },
      });

      await createAuditLog({
        userId: request.user.userId,
        userName: request.user.email || 'Admin',
        userRole,
        action: 'CETAK_SERTIFIKAT',
        targetModule: 'Sertifikat',
        details: `Menerbitkan sertifikat ${certificateNo} untuk ${studentExam.user.fullName} (Skor: ${studentExam.totalScore})`,
        ipAddress: request.ip,
      });

      return reply.status(201).send({
        success: true,
        message: 'Sertifikat berhasil diterbitkan!',
        data: cert,
      });
    });

    // Batch Download All Certificates in a Session or System as ZIP Archive (Admin/Proctor)
    protectedRoutes.get('/batch-zip', { preHandler: [hasRole(['SUPER_ADMIN', 'ADMIN_EPT', 'PROCTOR', 'EXECUTIVE'])] }, async (request, reply) => {
      const JSZip = (await import('jszip')).default;
      const { sessionId } = request.query as { sessionId?: string };

      const where: any = {};
      if (sessionId) {
        where.studentExam = { examSessionId: sessionId };
      }

      const certificates = await prisma.certificate.findMany({
        where,
        include: {
          studentExam: {
            include: {
              user: true,
              examSession: true,
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      });

      if (certificates.length === 0) {
        return reply.status(404).send({ success: false, message: 'Belum ada sertifikat yang diterbitkan.' });
      }

      const zip = new JSZip();
      const folder = zip.folder('Sertifikat_EPTUNU');

      let summaryText = `REKAPITULASI BATCH SERTIFIKAT EPTUNU\n`;
      summaryText += `Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}\n`;
      summaryText += `Jumlah Sertifikat: ${certificates.length}\n`;
      summaryText += `===========================================================\n\n`;

      for (let i = 0; i < certificates.length; i++) {
        const c = certificates[i];
        const studentName = c.studentExam.user.fullName.replace(/[^a-zA-Z0-9]/g, '_');
        const nim = c.studentExam.user.identityNumber;
        const certNoClean = c.certificateNo.replace(/\//g, '_');
        const fileName = `${certNoClean}_${nim}_${studentName}.txt`;

        summaryText += `${i + 1}. [${c.certificateNo}] ${c.studentExam.user.fullName} (${nim}) - Total Skor EPT: ${c.studentExam.totalScore || 0}\n`;

        const certContent = `
===========================================================
      UNIVERSITAS NAHDLATUL ULAMA PURWOKERTO
                 UPT BAHASA UNU
       OFFICIAL ENGLISH PROFICIENCY TEST CERTIFICATE
===========================================================

Nomor Sertifikat : ${c.certificateNo}
Nama Peserta     : ${c.studentExam.user.fullName}
NIM / NIP        : ${c.studentExam.user.identityNumber}
Fakultas         : ${c.studentExam.user.faculty || '-'}
Program Studi    : ${c.studentExam.user.prodi || '-'}
Sesi Ujian       : ${c.studentExam.examSession.title}
Tanggal Terbit   : ${c.issuedAt.toLocaleDateString('id-ID')}
Masa Berlaku s/d : ${c.validUntil.toLocaleDateString('id-ID')}

-----------------------------------------------------------
RINCIAN SKOR SKALA TOEFL ITP (310 - 677)
-----------------------------------------------------------
Section 1: Listening Comprehension    : ${c.studentExam.scoreListening || 0}
Section 2: Structure & Written Expr.  : ${c.studentExam.scoreStructure || 0}
Section 3: Reading Comprehension      : ${c.studentExam.scoreReading || 0}
-----------------------------------------------------------
TOTAL SKOR EPT                        : ${c.studentExam.totalScore || 0}
-----------------------------------------------------------

Verifikasi Keaslian Sertifikat Online:
https://ept.unupurwokerto.ac.id/verify/${encodeURIComponent(c.certificateNo)}

SHA-256 Signature Hash:
${c.verificationHash}

Penandatangan: ${c.signerName}
===========================================================
        `.trim();

        folder?.file(fileName, certContent);
      }

      folder?.file('00_REKAPITULASI_BATCH.txt', summaryText);

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      reply.header('Content-Type', 'application/zip');
      reply.header('Content-Disposition', `attachment; filename="Batch_Sertifikat_EPTUNU_${Date.now()}.zip"`);
      return reply.send(zipBuffer);
    });
  });
}
