import { prisma } from '@starter-kit/database';

async function main() {
  console.log('Seeding UNU Purwokerto Master Data (Institution, System Settings, Faculties, Study Programs)...');

  // 1. Seed Institution Master Data
  await prisma.institution.upsert({
    where: { code: '061045' },
    update: {
      name: 'Universitas Nahdlatul Ulama Purwokerto',
      isInternal: true,
    },
    create: {
      code: '061045',
      name: 'Universitas Nahdlatul Ulama Purwokerto',
      isInternal: true,
    },
  });
  console.log('✅ Institution (Kode PT: 061045 - UNU Purwokerto) updated!');

  // 2. Seed System Settings Data
  await prisma.systemSetting.upsert({
    where: { id: 'default' },
    update: {
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
      certValidityYears: 2,
    },
    create: {
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
      certValidityYears: 2,
      maintenanceMode: false,
    },
  });
  console.log('✅ System Settings (Address & Contact) updated!');

  // 3. Seed Faculties & Study Programs
  await prisma.studyProgram.deleteMany({});
  await prisma.faculty.deleteMany({});

  const facultiesData = [
    {
      code: 'FST',
      name: 'Fakultas Sains dan Teknologi',
      description: 'Fakultas bidang sains, rekayasa, biosistem, informatika, dan ilmu lingkungan.',
      prodis: [
        { code: '55200', name: 'S-1 Informatika' },
        { code: '54211', name: 'S-1 Agroteknologi' },
        { code: '46201', name: 'S-1 Biologi' },
        { code: '44201', name: 'S-1 Matematika' },
        { code: '41221', name: 'S-1 Teknologi Pangan' },
        { code: '41201', name: 'S-1 Teknik Pertanian dan Biosistem' },
        { code: '54247', name: 'S-1 Ilmu Perikanan' },
        { code: '54231', name: 'S-1 Peternakan' },
        { code: '95202', name: 'S-1 Sains Lingkungan' },
      ],
    },
    {
      code: 'FSEH',
      name: 'Fakultas Sosial Ekonomi dan Humaniora',
      description: 'Fakultas bidang administrasi publik, agribisnis, akuntansi, manajemen, ilmu hukum, keolahragaan, bahasa Inggris, dan IPA.',
      prodis: [
        { code: '63201', name: 'S-1 Administrasi Publik' },
        { code: '54201', name: 'S-1 Agribisnis' },
        { code: '62201', name: 'S-1 Akuntansi' },
        { code: '61201', name: 'S-1 Manajemen' },
        { code: '74201', name: 'S-1 Ilmu Hukum' },
        { code: '89201', name: 'S-1 Ilmu Keolahragaan' },
        { code: '88203', name: 'S-1 Pendidikan Bahasa Inggris' },
        { code: '84208', name: 'S-1 Pendidikan Ilmu Pengetahuan Alam' },
      ],
    },
    {
      code: 'FAI',
      name: 'Fakultas Agama Islam',
      description: 'Fakultas bidang pendidikan agama Islam, bahasa Arab, PGMI, PIAUD, dan hukum syariah.',
      prodis: [
        { code: '86230', name: 'S-1 Pendidikan Agama Islam' },
        { code: '88204', name: 'S-1 Pendidikan Bahasa Arab' },
        { code: '86232', name: 'S-1 Pendidikan Guru Madrasah Ibtidaiyah' },
        { code: '86236', name: 'S-1 Pendidikan Islam Anak Usia Dini' },
        { code: '74234', name: 'S-1 Hukum Syariah' },
      ],
    },
  ];

  for (const f of facultiesData) {
    const facultyObj = await prisma.faculty.create({
      data: { code: f.code, name: f.name, description: f.description },
    });
    console.log(`[FACULTY] Created: ${facultyObj.code} - ${facultyObj.name}`);

    for (const p of f.prodis) {
      const prodiObj = await prisma.studyProgram.create({
        data: { code: p.code, name: p.name, facultyId: facultyObj.id },
      });
      console.log(`  └─ [PRODI] Created: ${prodiObj.code} - ${prodiObj.name}`);
    }
  }

  console.log('✅ All UNU Purwokerto Master Data successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding master data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
