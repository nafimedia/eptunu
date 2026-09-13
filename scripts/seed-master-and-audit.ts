import { prisma } from '@starter-kit/database';

const db = prisma as any;

async function main() {
  console.log('🌱 Menjalankan seeder data riil untuk Master Data, Audit Log, dan Notifikasi...');

  // 1. Participant Types
  const participantTypes = [
    { code: 'MAHASISWA', name: 'Mahasiswa Reguler UNU Purwokerto', description: 'Mahasiswa aktif program diploma dan sarjana UNU Purwokerto.' },
    { code: 'DOSEN_TENDIK', name: 'Dosen & Tenaga Kependidikan', description: 'Staf pengajar dan staf kependidikan lingkungan universitas.' },
    { code: 'ALUMNI', name: 'Alumni UNU Purwokerto', description: 'Lulusan UNU Purwokerto yang memerlukan sertifikasi EPT.' },
    { code: 'UMUM', name: 'Peserta Eksternal / Umum', description: 'Masyarakat umum dan mitra institusi luar.' },
  ];

  for (const pt of participantTypes) {
    await db.participantType.upsert({
      where: { code: pt.code },
      update: { name: pt.name, description: pt.description },
      create: { code: pt.code, name: pt.name, description: pt.description },
    });
  }
  console.log(`✅ Berhasil menyelaraskan ${participantTypes.length} Jenis Peserta.`);

  // 2. Academic Years
  const academicYears = [
    { code: '2025/2026-GANJIL', name: 'Tahun Akademik 2025/2026 Ganjil', isCurrent: true },
    { code: '2025/2026-GENAP', name: 'Tahun Akademik 2025/2026 Genap', isCurrent: false },
    { code: '2024/2025-GENAP', name: 'Tahun Akademik 2024/2025 Genap', isCurrent: false },
  ];

  for (const ay of academicYears) {
    await db.academicYear.upsert({
      where: { code: ay.code },
      update: { name: ay.name, isCurrent: ay.isCurrent },
      create: { code: ay.code, name: ay.name, isCurrent: ay.isCurrent },
    });
  }
  console.log(`✅ Berhasil menyelaraskan ${academicYears.length} Tahun Akademik.`);

  // 3. Initial Audit Logs
  const superAdmin = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

  const auditCount = await db.auditLog.count();
  if (auditCount === 0) {
    const initialLogs = [
      {
        userId: superAdmin?.id || null,
        userName: superAdmin?.fullName || 'Super Administrator',
        userRole: 'SUPER_ADMIN',
        action: 'SISTEM_INIT',
        targetModule: 'Sistem',
        details: 'Inisialisasi sistem CBT EPTUNU dan sinkronisasi basis data MySQL db_eptunu.',
        ipAddress: '127.0.0.1',
      },
      {
        userId: superAdmin?.id || null,
        userName: superAdmin?.fullName || 'Super Administrator',
        userRole: 'SUPER_ADMIN',
        action: 'VERIFIKASI_BANK_SOAL',
        targetModule: 'Bank Soal',
        details: 'Verifikasi dan validasi 185 butir soal dan 7 passage reading terverifikasi di database.',
        ipAddress: '127.0.0.1',
      },
      {
        userId: superAdmin?.id || null,
        userName: superAdmin?.fullName || 'Super Administrator',
        userRole: 'SUPER_ADMIN',
        action: 'PUBLISH_JADWAL',
        targetModule: 'Ujian',
        details: 'Penerbitan jadwal sesi ujian EPT Periode Aktif 2026 untuk peserta reguler.',
        ipAddress: '127.0.0.1',
      },
    ];

    for (const l of initialLogs) {
      await db.auditLog.create({ data: l });
    }
    console.log(`✅ Berhasil membuat ${initialLogs.length} entri riil Audit Log awal.`);
  }

  // 4. Initial System & Student Notifications
  const notifCount = await db.notification.count();
  if (notifCount === 0) {
    await db.notification.create({
      data: {
        userId: null, // Broadcast
        title: 'Selamat Datang di Portal EPTUNU CBT',
        message: 'Platform Ujian Sertifikasi Bahasa Inggris Resmi UPT Bahasa UNU Purwokerto aktif.',
        type: 'INFO',
        link: '/dashboard',
      },
    });

    const studentUser = await db.user.findFirst({ where: { role: 'STUDENT' } });
    if (studentUser) {
      await db.notification.create({
        data: {
          userId: studentUser.id,
          title: 'Verifikasi Pendaftaran EPT',
          message: 'Pendaftaran ujian Anda pada periode aktif telah terverifikasi oleh operator UPT Bahasa.',
          type: 'SUCCESS',
          link: '/dashboard/results',
        },
      });
    }
    console.log(`✅ Berhasil membuat notifikasi riil sistem & peserta.`);
  }

  await db.$disconnect();
  console.log('🎉 Migrasi data riil master data & audit log selesai.');
}

main().catch((err) => {
  console.error('❌ Error seeding:', err);
  process.exit(1);
});
