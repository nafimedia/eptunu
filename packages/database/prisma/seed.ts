import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient() as any;

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });
}

async function main() {
  console.log('🌱 Starting EPTUNU Participant Registrations & Master Data database seeding...');

  const defaultPassword = await hashPassword('password123');

  // 1. Seed Accounts for All 7 Roles
  const rolesData = [
    {
      identityNumber: 'SUPERADMIN01',
      fullName: 'Super Administrator Utama',
      email: 'superadmin@unupurwokerto.ac.id',
      role: 'SUPER_ADMIN',
      faculty: 'BPTI UNU Purwokerto',
    },
    {
      identityNumber: 'ADMINEPT01',
      fullName: 'Admin Operator UPT Bahasa',
      email: 'adminept@unupurwokerto.ac.id',
      role: 'ADMIN_EPT',
      faculty: 'UPT Bahasa',
    },
    {
      identityNumber: 'AUTHOR01',
      fullName: 'Penyusun Soal Bahasa',
      email: 'author@unupurwokerto.ac.id',
      role: 'QUESTION_AUTHOR',
      faculty: 'Pusat Bahasa',
    },
    {
      identityNumber: 'VALIDATOR01',
      fullName: 'Validator Soal EPT',
      email: 'validator@unupurwokerto.ac.id',
      role: 'VALIDATOR',
      faculty: 'Tim Penjamin Mutu',
    },
    {
      identityNumber: 'PROCTOR01',
      fullName: 'Pengawas Ujian Utama',
      email: 'proctor@unupurwokerto.ac.id',
      role: 'PROCTOR',
      faculty: 'UPT Bahasa',
    },
    {
      identityNumber: '202601001',
      fullName: 'Ahmad Fauzi (Mahasiswa)',
      email: 'ahmad.fauzi@student.unupurwokerto.ac.id',
      role: 'STUDENT',
      prodi: 'Teknik Informatika',
      faculty: 'Sains dan Teknologi',
    },
    {
      identityNumber: 'EXECUTIVE01',
      fullName: 'Dr. H. Wakil Rektor (Pimpinan)',
      email: 'pimpinan@unupurwokerto.ac.id',
      role: 'EXECUTIVE',
      faculty: 'Rektorat',
    },
  ];

  for (const u of rolesData) {
    await prisma.user.upsert({
      where: { identityNumber: u.identityNumber },
      update: { role: u.role, fullName: u.fullName },
      create: {
        identityNumber: u.identityNumber,
        fullName: u.fullName,
        email: u.email,
        passwordHash: defaultPassword,
        role: u.role,
        prodi: u.prodi,
        faculty: u.faculty,
      },
    });
  }

  // Fetch Proctor user ID
  const proctor = await prisma.user.findUnique({ where: { identityNumber: 'PROCTOR01' } });

  // 2. Seed Master Data: Faculties & Study Programs
  const faculties = [
    {
      code: 'FST',
      name: 'Fakultas Sains dan Teknologi',
      description: 'Fakultas bidang sains, rekayasa, teknologi pangan, dan ilmu komputer.',
      prodis: [
        { code: 'TI', name: 'S1 Teknik Informatika' },
        { code: 'SI', name: 'S1 Sistem Informasi' },
        { code: 'AGT', name: 'S1 Agroteknologi' },
        { code: 'TP', name: 'S1 Teknologi Pangan' },
        { code: 'TS', name: 'S1 Teknik Sipil' },
        { code: 'BKW', name: 'S1 Bio Kewirausahaan' },
      ],
    },
    {
      code: 'FIKES',
      name: 'Fakultas Ilmu Kesehatan',
      description: 'Fakultas kebidanan, keperawatan, dan profesi ners.',
      prodis: [
        { code: 'KEP', name: 'S1 Keperawatan' },
        { code: 'BID', name: 'D3 Kebidanan' },
        { code: 'NERS', name: 'Profesi Ners' },
      ],
    },
    {
      code: 'FISIP',
      name: 'Fakultas Sosial dan Politik',
      description: 'Fakultas bidang hubungan internasional dan administrasi publik.',
      prodis: [
        { code: 'HI', name: 'S1 Hubungan Internasional' },
        { code: 'AP', name: 'S1 Administrasi Publik' },
      ],
    },
    {
      code: 'FEB',
      name: 'Fakultas Ekonomi dan Bisnis',
      description: 'Fakultas bidang manajemen dan akuntansi.',
      prodis: [
        { code: 'MJ', name: 'S1 Manajemen' },
        { code: 'AKT', name: 'S1 Akuntansi' },
      ],
    },
    {
      code: 'FKIP',
      name: 'Fakultas Keguruan dan Ilmu Pendidikan',
      description: 'Fakultas bidang pendidikan bahasa Inggris, SD, dan matematika.',
      prodis: [
        { code: 'PBI', name: 'S1 Pendidikan Bahasa Inggris' },
        { code: 'PGSD', name: 'S1 Pendidikan Guru Sekolah Dasar' },
        { code: 'PMAT', name: 'S1 Pendidikan Matematika' },
      ],
    },
  ];

  for (const f of faculties) {
    const facultyObj = await prisma.faculty.upsert({
      where: { code: f.code },
      update: { name: f.name, description: f.description },
      create: { code: f.code, name: f.name, description: f.description },
    });

    for (const p of f.prodis) {
      await prisma.studyProgram.upsert({
        where: { code: p.code },
        update: { name: p.name, facultyId: facultyObj.id },
        create: { code: p.code, name: p.name, facultyId: facultyObj.id },
      });
    }
  }

  // 3. Seed Reading Passage
  const passage = await prisma.passage.create({
    data: {
      title: 'The Development of Higher Education in Purwokerto',
      content: 'Purwokerto, a growing educational hub in Central Java, has seen significant developments in higher education over the past decade. Institutions like Universitas Nahdlatul Ulama Purwokerto (UNU Purwokerto) have integrated modern technology with traditional values, offering students comprehensive academic programs tailored for global competitiveness.',
    },
  });

  // 4. Seed Questions
  await prisma.question.deleteMany({});
  await prisma.question.createMany({
    data: [
      {
        section: 'LISTENING',
        listeningPart: 'PART_A',
        audioUrl: '/audio/listening_part_a_q1.mp3',
        questionText: 'What does the man mean by saying "Count me in"?',
        options: [
          { id: 'A', text: 'He wants to calculate the total budget.' },
          { id: 'B', text: 'He agrees to participate in the seminar.' },
          { id: 'C', text: 'He is busy with his homework.' },
          { id: 'D', text: 'He cannot attend the meeting.' },
        ],
        correctOption: 'B',
        explanation: 'The idiom "Count me in" means the speaker wants to be included or participate.',
        skillTag: 'Short Conversation - Idioms',
        difficulty: 'EASY',
        status: 'APPROVED',
      },
      {
        section: 'LISTENING',
        listeningPart: 'PART_B',
        audioUrl: '/audio/listening_part_b_q1.mp3',
        questionText: 'What are the speakers mainly discussing regarding campus facilities?',
        options: [
          { id: 'A', text: 'The expansion of the central library.' },
          { id: 'B', text: 'The new computer lab schedule.' },
          { id: 'C', text: 'Renovations in the student center.' },
          { id: 'D', text: 'Parking fees for university staff.' },
        ],
        correctOption: 'A',
        explanation: 'Part B conversation centers around library extension plans.',
        skillTag: 'Long Conversation - Main Topic',
        difficulty: 'MEDIUM',
        status: 'APPROVED',
      },
      {
        section: 'STRUCTURE',
        questionText: 'The dean of the faculty, along with several department chairs, _______ attending the national education conference in Jakarta.',
        options: [
          { id: 'A', text: 'are' },
          { id: 'B', text: 'is' },
          { id: 'C', text: 'were' },
          { id: 'D', text: 'have been' },
        ],
        correctOption: 'B',
        explanation: 'The subject is singular ("The dean"), phrases with "along with" do not change subject number.',
        skillTag: 'Subject-Verb Agreement',
        difficulty: 'MEDIUM',
        status: 'APPROVED',
      },
      {
        section: 'STRUCTURE',
        questionText: 'Not only _______ the exam with honors, but she also secured a full scholarship for her Master degree.',
        options: [
          { id: 'A', text: 'she passed' },
          { id: 'B', text: 'did she pass' },
          { id: 'C', text: 'passed she' },
          { id: 'D', text: 'she did pass' },
        ],
        correctOption: 'B',
        explanation: 'Inversion occurs after negative adverbial phrases like "Not only".',
        skillTag: 'Inversion after Negative Expressions',
        difficulty: 'HARD',
        status: 'APPROVED',
      },
      {
        section: 'READING',
        passageId: passage.id,
        questionText: 'What is the main topic of the passage?',
        options: [
          { id: 'A', text: 'The history of Central Java geography' },
          { id: 'B', text: 'Educational developments in Purwokerto' },
          { id: 'C', text: 'Technological innovations in farming' },
          { id: 'D', text: 'Global trade in Indonesia' },
        ],
        correctOption: 'B',
        explanation: 'The paragraph explicitly outlines higher education growth in Purwokerto.',
        skillTag: 'Main Idea',
        difficulty: 'EASY',
        status: 'APPROVED',
      },
    ],
  });

  // 5. Seed Score Conversion Tables
  const listeningScores = [
    31, 31, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    50, 51, 51, 52, 52, 53, 54, 54, 55, 56, 57, 57, 58, 59, 60, 61, 62, 63, 64, 65,
    66, 67, 68, 68, 68, 68, 68, 68, 68, 68, 68
  ];

  const structureScores = [
    31, 31, 31, 33, 35, 37, 38, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
    54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 65, 66, 67, 68, 68, 68, 68, 68,
    68, 68, 68, 68, 68, 68, 68, 68, 68, 68, 68
  ];

  const readingScores = [
    31, 31, 31, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67,
    67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67
  ];

  for (let raw = 0; raw <= 50; raw++) {
    await prisma.scoreConversion.upsert({
      where: { section_rawScore: { section: 'LISTENING', rawScore: raw } },
      update: { scaledScore: listeningScores[raw] },
      create: { section: 'LISTENING', rawScore: raw, scaledScore: listeningScores[raw] }
    });

    await prisma.scoreConversion.upsert({
      where: { section_rawScore: { section: 'STRUCTURE', rawScore: raw } },
      update: { scaledScore: structureScores[raw] },
      create: { section: 'STRUCTURE', rawScore: raw, scaledScore: structureScores[raw] }
    });

    await prisma.scoreConversion.upsert({
      where: { section_rawScore: { section: 'READING', rawScore: raw } },
      update: { scaledScore: readingScores[raw] },
      create: { section: 'READING', rawScore: raw, scaledScore: readingScores[raw] }
    });
  }

  // 6. Seed Exam Sessions (Jadwal Ujian)
  const session1 = await prisma.examSession.upsert({
    where: { token: 'EPT2026' },
    update: {
      room: 'Lab Komputer 1 (Gedung Rektorat Lt. 2)',
      quota: 35,
      proctorId: proctor?.id || null,
    },
    create: {
      title: 'EPT Regular Periode Juli 2026 - Sesi Pagi',
      token: 'EPT2026',
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      durationMin: 110,
      room: 'Lab Komputer 1 (Gedung Rektorat Lt. 2)',
      quota: 35,
      proctorId: proctor?.id || null,
      isActive: true,
    },
  });

  // 7. Seed Student Exam Record with Registration No & Verification Status
  const student = await prisma.user.findUnique({ where: { identityNumber: '202601001' } });
  if (student) {
    await prisma.studentExam.upsert({
      where: {
        userId_examSessionId: {
          userId: student.id,
          examSessionId: session1.id,
        },
      },
      update: {
        verificationStatus: 'VERIFIED',
        registrationNo: 'REG/2026/07/0001',
      },
      create: {
        userId: student.id,
        examSessionId: session1.id,
        status: 'SCHEDULED',
        verificationStatus: 'VERIFIED',
        registrationNo: 'REG/2026/07/0001',
        paymentProofUrl: '/storage/payments/sample_payment_proof.jpg',
        verificationNotes: 'Pembayaran Lunas via Transfer Mandiri UPT Bahasa.',
      },
    });
  }

  console.log('🎉 EPTUNU Seeding with Participant Registrations completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
