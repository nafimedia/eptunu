import { prisma } from '@starter-kit/database';
import crypto from 'crypto';
import JSZip from 'jszip';
import { createAuditLog } from '../../middleware/audit';
import { SYSTEM_DEFAULTS } from '../../config/constants';

export class CertificatesService {
  /**
   * Get certificate verification data by certificate number or ID (Public)
   */
  static async verifyCertificate(certificateNo: string) {
    const decodedNo = decodeURIComponent(certificateNo).trim();

    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ certificateNo: decodedNo }, { id: decodedNo }],
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
      return null;
    }

    const isExpired = new Date() > cert.validUntil;

    return {
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
    };
  }

  /**
   * List all certificates with search & pagination (Admin/Proctor/Executive)
   */
  static async listCertificates(search?: string, limit: number = SYSTEM_DEFAULTS.PAGE_SIZE) {
    const where: any = {};
    if (search) {
      where.OR = [
        { certificateNo: { contains: search } },
        { studentExam: { user: { fullName: { contains: search } } } },
        { studentExam: { user: { identityNumber: { contains: search } } } },
      ];
    }

    return prisma.certificate.findMany({
      where,
      take: Math.min(limit, SYSTEM_DEFAULTS.MAX_PAGE_SIZE),
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
  }

  /**
   * Get certificates belonging to a specific student
   */
  static async getStudentCertificates(userId: string) {
    return prisma.certificate.findMany({
      where: { studentExam: { userId } },
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
  }

  /**
   * Issue a new certificate using atomic transactions
   */
  static async issueCertificate(params: {
    studentExamId: string;
    issuerUserId: string;
    issuerName: string;
    issuerRole: string;
    ipAddress?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const studentExam = await tx.studentExam.findUnique({
        where: { id: params.studentExamId },
        include: {
          user: true,
          examSession: true,
          certificate: true,
        },
      });

      if (!studentExam) {
        throw new Error('NOT_FOUND: Data hasil ujian tidak ditemukan');
      }

      if (studentExam.certificate) {
        return { isExisting: true, certificate: studentExam.certificate };
      }

      const settings = (await tx.systemSetting.findFirst()) || {
        signerName: 'Kepala UPT Bahasa UNU Purwokerto',
        certValidityYears: SYSTEM_DEFAULTS.CERTIFICATE_VALIDITY_YEARS,
      };

      const now = new Date();
      const validUntil = new Date();
      validUntil.setFullYear(
        now.getFullYear() + (settings.certValidityYears || SYSTEM_DEFAULTS.CERTIFICATE_VALIDITY_YEARS)
      );

      const count = await tx.certificate.count();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const sequence = String(count + 1).padStart(4, '0');
      const certificateNo = `EPT/UNUPWT/${year}/${month}/${sequence}`;

      const hashInput = `${certificateNo}|${studentExam.userId}|${studentExam.totalScore || 0}|${now.toISOString()}`;
      const verificationHash = crypto.createHash('sha256').update(hashInput).digest('hex');
      const pdfPath = `/storage/certificates/${certificateNo.replace(/\//g, '_')}.pdf`;

      const cert = await tx.certificate.create({
        data: {
          certificateNo,
          studentExamId: params.studentExamId,
          issuedAt: now,
          validUntil,
          signerName: settings.signerName,
          verificationHash,
          pdfPath,
        },
      });

      await createAuditLog({
        userId: params.issuerUserId,
        userName: params.issuerName,
        userRole: params.issuerRole,
        action: 'CETAK_SERTIFIKAT',
        targetModule: 'Sertifikat',
        details: `Menerbitkan sertifikat ${certificateNo} untuk ${studentExam.user.fullName} (Skor: ${studentExam.totalScore})`,
        ipAddress: params.ipAddress,
      });

      return { isExisting: false, certificate: cert };
    });
  }

  /**
   * Generate batch certificates ZIP archive
   */
  static async generateBatchZip(sessionId?: string) {
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
      return null;
    }

    const zip = new JSZip();
    const folder = zip.folder('Sertifikat_EPTUNU');

    let summaryText = `REKAPITULASI BATCH SERTIFIKAT EPTUNU\n`;
    summaryText += `Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}\n`;
    summaryText += `Jumlah Sertifikat: ${certificates.length}\n`;
    summaryText += `===========================================================\n\n`;

    certificates.forEach((c, i) => {
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
    });

    folder?.file('00_REKAPITULASI_BATCH.txt', summaryText);

    return zip.generateAsync({ type: 'nodebuffer' });
  }
}
