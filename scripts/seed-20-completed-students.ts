import { prisma } from '@starter-kit/database';
import argon2 from 'argon2';
import crypto from 'crypto';

const db = prisma as any;

async function main() {
  console.log('🚀 Seeding 20 Peserta Ujian Selesai (Completed) + Sertifikat EPTUNU...');

  const passwordHash = await argon2.hash('Password123!');

  // 1. Fetch or Create Active Exam Session
  let session = await db.examSession.findFirst({
    where: { isActive: true },
  });

  if (!session) {
    session = await db.examSession.create({
      data: {
        title: 'EPT Regular Periode Juli 2026 - Sesi Utama',
        token: 'EPT2026',
        startTime: new Date('2026-07-25T08:00:00Z'),
        endTime: new Date('2026-07-25T11:00:00Z'),
        durationMin: 110,
        room: 'Lab Komputer 1 (Gedung Rektorat Lt. 2)',
        quota: 50,
        isActive: true,
      },
    });
  }

  // 2. Fetch Sample Questions for Answer Logs
  const questions = await db.question.findMany({ take: 10 });

  // 3. 20 Student Datasets
  const studentsData = [
    { nim: '202601001', name: 'Ahmad Fauzi', email: 'ahmad.fauzi@student.unupurwokerto.ac.id', faculty: 'Fakultas Sains dan Teknologi', prodi: 'Teknik Informatika', l: 52, s: 54, r: 50, total: 520 },
    { nim: '202601002', name: 'Siti Nurhaliza', email: 'siti.nurhaliza@student.unupurwokerto.ac.id', faculty: 'Fakultas Sains dan Teknologi', prodi: 'Biologi', l: 48, s: 50, r: 49, total: 490 },
    { nim: '202601003', name: 'Budi Santoso', email: 'budi.santoso@student.unupurwokerto.ac.id', faculty: 'Fakultas Sains dan Teknologi', prodi: 'Agribisnis', l: 45, s: 48, r: 47, total: 467 },
    { nim: '202601004', name: 'Dewi Lestari', email: 'dewi.lestari@student.unupurwokerto.ac.id', faculty: 'Fakultas Sosial Ekonomi dan Humaniora', prodi: 'Manajemen', l: 55, s: 58, r: 56, total: 563 },
    { nim: '202601005', name: 'Muhammad Rizky', email: 'muhammad.rizky@student.unupurwokerto.ac.id', faculty: 'Fakultas Sosial Ekonomi dan Humaniora', prodi: 'Akuntansi', l: 51, s: 53, r: 52, total: 520 },
    { nim: '202601006', name: 'Anisa Rahma', email: 'anisa.rahma@student.unupurwokerto.ac.id', faculty: 'Fakultas Agama Islam', prodi: 'Pendidikan Agama Islam', l: 47, s: 49, r: 48, total: 480 },
    { nim: '202601007', name: 'Fajar Pratama', email: 'fajar.pratama@student.unupurwokerto.ac.id', faculty: 'Fakultas Sains dan Teknologi', prodi: 'Perikanan', l: 43, s: 45, r: 44, total: 440 },
    { nim: '202601008', name: 'Rina Wijaya', email: 'rina.wijaya@student.unupurwokerto.ac.id', faculty: 'Fakultas Sosial Ekonomi dan Humaniora', prodi: 'Hukum', l: 58, s: 60, r: 57, total: 583 },
    { nim: '202601009', name: 'Eko Prasetyo', email: 'eko.prasetyo@student.unupurwokerto.ac.id', faculty: 'Fakultas Sains dan Teknologi', prodi: 'Peternakan', l: 50, s: 52, r: 51, total: 510 },
    { nim: '202601010', name: 'Maya Indah', email: 'maya.indah@student.unupurwokerto.ac.id', faculty: 'Fakultas Sosial Ekonomi dan Humaniora', prodi: 'Komunikasi', l: 53, s: 55, r: 54, total: 540 },
    { nim: '202601011', name: 'Hendra Kurniawan', email: 'hendra.kurniawan@student.unupurwokerto.ac.id', faculty: 'Fakultas Agama Islam', prodi: 'Hukum Keluarga Islam', l: 46, s: 48, r: 47, total: 470 },
    { nim: '202601012', name: 'Nurul Hidayah', email: 'nurul.hidayah@student.unupurwokerto.ac.id', faculty: 'Fakultas Agama Islam', prodi: 'Ekonomi Syariah', l: 52, s: 54, r: 53, total: 530 },
    { nim: '202601013', name: 'Bayu Saputra', email: 'bayu.saputra@student.unupurwokerto.ac.id', faculty: 'Fakultas Sains dan Teknologi', prodi: 'Teknik Mesin', l: 44, s: 46, r: 45, total: 450 },
    { nim: '202601014', name: 'Tri Utami', email: 'tri.utami@student.unupurwokerto.ac.id', faculty: 'Fakultas Sosial Ekonomi dan Humaniora', prodi: 'Pendidikan Bahasa Inggris', l: 62, s: 64, r: 63, total: 630 },
    { nim: '202601015', name: 'Agus Setiawan', email: 'agus.setiawan@student.unupurwokerto.ac.id', faculty: 'Fakultas Sains dan Teknologi', prodi: 'Teknik Sipil', l: 49, s: 51, r: 50, total: 500 },
    { nim: '202601016', name: 'Larasati Putri', email: 'larasati.putri@student.unupurwokerto.ac.id', faculty: 'Fakultas Sosial Ekonomi dan Humaniora', prodi: 'Psikologi', l: 54, s: 56, r: 55, total: 550 },
    { nim: '202601017', name: 'Dedi Iskandar', email: 'dedi.iskandar@student.unupurwokerto.ac.id', faculty: 'Fakultas Agama Islam', prodi: 'Pendidikan Bahasa Arab', l: 48, s: 50, r: 49, total: 490 },
    { nim: '202601018', name: 'Fitriani Dewi', email: 'fitriani.dewi@student.unupurwokerto.ac.id', faculty: 'Fakultas Sains dan Teknologi', prodi: 'Bioteknologi', l: 56, s: 58, r: 57, total: 570 },
    { nim: '202601019', name: 'Adi Nugroho', email: 'adi.nugroho@student.unupurwokerto.ac.id', faculty: 'Fakultas Sosial Ekonomi dan Humaniora', prodi: 'Hubungan Internasional', l: 60, s: 62, r: 61, total: 610 },
    { nim: '202601020', name: 'Yulia Anggraini', email: 'yulia.anggraini@student.unupurwokerto.ac.id', faculty: 'Fakultas Agama Islam', prodi: 'Studi Islam', l: 50, s: 52, r: 51, total: 510 },
  ];

  let seededCount = 0;

  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];

    // Upsert User Student Account
    const user = await db.user.upsert({
      where: { identityNumber: s.nim },
      update: {
        fullName: s.name,
        email: s.email,
        faculty: s.faculty,
        prodi: s.prodi,
        role: 'STUDENT',
      },
      create: {
        identityNumber: s.nim,
        fullName: s.name,
        email: s.email,
        passwordHash,
        role: 'STUDENT',
        faculty: s.faculty,
        prodi: s.prodi,
      },
    });

    // Upsert StudentExam with COMPLETED Status
    const studentExam = await db.studentExam.upsert({
      where: {
        userId_examSessionId: {
          userId: user.id,
          examSessionId: session.id,
        },
      },
      update: {
        status: 'SUBMITTED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-07-25T08:00:00Z'),
        submittedAt: new Date('2026-07-25T09:45:00Z'),
        scoreListening: s.l,
        scoreStructure: s.s,
        scoreReading: s.r,
        totalScore: s.total,
        registrationNo: `REG/UNUPWT/2026/${String(i + 1).padStart(4, '0')}`,
      },
      create: {
        userId: user.id,
        examSessionId: session.id,
        status: 'SUBMITTED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-07-25T08:00:00Z'),
        submittedAt: new Date('2026-07-25T09:45:00Z'),
        scoreListening: s.l,
        scoreStructure: s.s,
        scoreReading: s.r,
        totalScore: s.total,
        registrationNo: `REG/UNUPWT/2026/${String(i + 1).padStart(4, '0')}`,
      },
    });

    // Seed Answer Logs for analytics charts
    for (const q of questions) {
      await db.answerLog.upsert({
        where: {
          studentExamId_questionId: {
            studentExamId: studentExam.id,
            questionId: q.id,
          },
        },
        update: { selectedOption: 'A' },
        create: {
          studentExamId: studentExam.id,
          questionId: q.id,
          selectedOption: 'A',
        },
      });
    }

    // Seed Certificate for Passed Students
    if (s.total >= 440) {
      const seqStr = String(i + 1).padStart(4, '0');
      const certNo = `EPT/UNUPWT/2026/07/${seqStr}`;
      const now = new Date('2026-07-25T10:00:00Z');
      const validUntil = new Date('2028-07-25T10:00:00Z');
      const hashInput = `${certNo}|${user.id}|${s.total}|${now.toISOString()}`;
      const verificationHash = crypto.createHash('sha256').update(hashInput).digest('hex');

      await db.certificate.upsert({
        where: { studentExamId: studentExam.id },
        update: {
          certificateNo: certNo,
          issuedAt: now,
          validUntil,
          signerName: 'Kepala UPT Bahasa UNU Purwokerto',
          verificationHash,
          pdfPath: `/storage/certificates/${certNo.replace(/\//g, '_')}.pdf`,
        },
        create: {
          certificateNo: certNo,
          studentExamId: studentExam.id,
          issuedAt: now,
          validUntil,
          signerName: 'Kepala UPT Bahasa UNU Purwokerto',
          verificationHash,
          pdfPath: `/storage/certificates/${certNo.replace(/\//g, '_')}.pdf`,
        },
      });
    }

    seededCount++;
    console.log(`  [${i + 1}/20] Seeded: ${s.name} (${s.nim}) - ${s.faculty} (${s.prodi}) -> Skor EPT: ${s.total}`);
  }

  console.log(`\n🎉 SUKSES! ${seededCount} Peserta Ujian Selesai & Sertifikat EPTUNU Berhasil Di-seed.`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
