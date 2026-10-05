import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { calculateEptScore } from './grading.util';
import { createAuditLog } from '../../middleware/audit';

export const StartExamSchema = z.object({
  token: z.string().min(1, 'Token ujian wajib diisi'),
});

function createPRNG(seedString: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 16777619);
  }
  return function random() {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    return ((h += h << 5) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(array: T[], seedString: string): T[] {
  const rng = createPRNG(seedString);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const SyncAnswersSchema = z.object({
  studentExamId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOption: z.enum(['A', 'B', 'C', 'D']).nullable(),
      isFlagged: z.boolean().default(false),
    })
  ),
});

export const SubmitExamSchema = z.object({
  studentExamId: z.string().uuid(),
});

export async function getExamQuestionsForStudent(studentExamId: string) {
  // 1. Fetch APPROVED questions only
  const rawQuestions = await prisma.question.findMany({
    where: { status: 'APPROVED' },
    include: {
      passage: true,
    },
    orderBy: [
      { section: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  // 2. Separate by section
  const rawListening = rawQuestions.filter((q) => q.section === 'LISTENING');
  const rawStructure = rawQuestions.filter((q) => q.section === 'STRUCTURE');
  const rawReading = rawQuestions.filter((q) => q.section === 'READING');

  // --- SECTION 1: LISTENING (Standard: 50 Questions, grouped by PART_A, PART_B, PART_C) ---
  const partA = rawListening.filter((q) => q.listeningPart === 'PART_A');
  const partB = rawListening.filter((q) => q.listeningPart === 'PART_B');
  const partC = rawListening.filter((q) => q.listeningPart === 'PART_C');
  const otherListening = rawListening.filter((q) => !q.listeningPart || !['PART_A', 'PART_B', 'PART_C'].includes(q.listeningPart));

  // Deterministic shuffle within parts
  const shuffledPartA = seededShuffle(partA.length > 0 ? partA : otherListening.slice(0, 30), `${studentExamId}_LIST_A`);
  const shuffledPartB = seededShuffle(partB.length > 0 ? partB : otherListening.slice(30, 38), `${studentExamId}_LIST_B`);
  const shuffledPartC = seededShuffle(partC.length > 0 ? partC : otherListening.slice(38, 50), `${studentExamId}_LIST_C`);

  const combinedListening = [
    ...shuffledPartA.slice(0, 30),
    ...shuffledPartB.slice(0, 8),
    ...shuffledPartC.slice(0, 12),
  ];

  // If combinedListening < 50, fill from any remaining approved listening questions
  if (combinedListening.length < 50) {
    const existingIds = new Set(combinedListening.map((q) => q.id));
    for (const q of rawListening) {
      if (!existingIds.has(q.id) && combinedListening.length < 50) {
        combinedListening.push(q);
      }
    }
  }

  // --- SECTION 2: STRUCTURE (Standard: 40 Questions) ---
  // Shuffle questions order deterministically, but DO NOT shuffle options A, B, C, D (so Written Expression matches sentences)
  const shuffledStructure = seededShuffle(rawStructure, `${studentExamId}_STRUCTURE`).slice(0, 40);

  // --- SECTION 3: READING (Standard: 50 Questions, grouped by Passage) ---
  // Group questions by passageId
  const passageMap = new Map<string, typeof rawReading>();
  const independentReading: typeof rawReading = [];

  for (const q of rawReading) {
    if (q.passageId) {
      const list = passageMap.get(q.passageId) || [];
      list.push(q);
      passageMap.set(q.passageId, list);
    } else {
      independentReading.push(q);
    }
  }

  // Shuffle passage groups order deterministically
  const passageKeys = Array.from(passageMap.keys());
  const shuffledPassageKeys = seededShuffle(passageKeys, `${studentExamId}_READ_PASSAGES`);

  const combinedReading: typeof rawReading = [];
  for (const pKey of shuffledPassageKeys) {
    const pQuestions = passageMap.get(pKey) || [];
    // Shuffle questions within the passage deterministically
    const shuffledWithinPassage = seededShuffle(pQuestions, `${studentExamId}_P_${pKey}`);
    for (const q of shuffledWithinPassage) {
      if (combinedReading.length < 50) {
        combinedReading.push(q);
      }
    }
  }

  // If < 50 questions, fill with independent reading
  if (combinedReading.length < 50) {
    for (const q of independentReading) {
      if (combinedReading.length < 50) {
        combinedReading.push(q);
      }
    }
  }

  const allSelectedQuestions = [
    ...combinedListening,
    ...shuffledStructure,
    ...combinedReading,
  ];

  // Sanitize questions: ensure options are strictly sorted by option id (A, B, C, D)
  // NEVER leak correctOption or explanation to the client
  return allSelectedQuestions.map((q) => {
    let originalOptions: any[] = [];
    if (Array.isArray(q.options)) {
      originalOptions = (q.options as any[]).slice();
      // Ensure choices are in natural A, B, C, D order
      originalOptions.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    }

    return {
      id: q.id,
      section: q.section,
      listeningPart: q.listeningPart,
      questionText: q.questionText,
      audioUrl: q.audioUrl,
      options: originalOptions,
      skillTag: q.skillTag,
      passage: q.passage ? {
        id: q.passage.id,
        title: q.passage.title,
        content: q.passage.content,
      } : null,
    };
  });
}

export async function examRoutes(fastify: FastifyInstance) {
  // All exam routes require authentication
  fastify.addHook('preHandler', authenticate);

  // 1. START EXAM SESSION
  fastify.post('/start', async (request, reply) => {
    const body = StartExamSchema.parse(request.body);
    const userId = request.user.userId;

    const session = await prisma.examSession.findUnique({
      where: { token: body.token.trim().toUpperCase() },
    });

    if (!session || !session.isActive) {
      return reply.status(400).send({
        success: false,
        message: 'Token ujian tidak valid atau sesi ujian tidak aktif.',
      });
    }

    const now = new Date();
    // Allow entry up to 30 minutes before startTime or anytime session is active, up to endTime
    const earlyEntryBufferMs = 30 * 60 * 1000;
    if (now.getTime() < new Date(session.startTime).getTime() - earlyEntryBufferMs || now > session.endTime) {
      return reply.status(400).send({
        success: false,
        message: 'Sesi ujian belum dimulai atau telah berakhir.',
      });
    }

    // Find or create StudentExam
    let studentExam = await prisma.studentExam.findUnique({
      where: {
        userId_examSessionId: {
          userId,
          examSessionId: session.id,
        },
      },
      include: {
        answers: true,
      },
    });

    if (!studentExam) {
      studentExam = await prisma.studentExam.create({
        data: {
          userId,
          examSessionId: session.id,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
        include: {
          answers: true,
        },
      });
    } else if (studentExam.verificationStatus === 'REJECTED') {
      return reply.status(403).send({
        success: false,
        message: 'Pendaftaran Anda pada sesi ujian ini telah ditolak oleh verifikator. Silakan hubungi administrator UPT Bahasa.',
      });
    } else if (studentExam.status === 'SUBMITTED' || studentExam.status === 'FORCE_SUBMITTED') {
      return reply.status(403).send({
        success: false,
        message: 'Anda sudah menyelesaikan ujian ini.',
      });
    } else if (studentExam.status === 'SCHEDULED' || !studentExam.startedAt) {
      studentExam = await prisma.studentExam.update({
        where: { id: studentExam.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: studentExam.startedAt || new Date(),
        },
        include: {
          answers: true,
        },
      });
    }

    const questions = await getExamQuestionsForStudent(studentExam.id);

    const durationSec = session.durationMin * 60;
    const elapsedSec = studentExam.startedAt
      ? Math.floor((Date.now() - new Date(studentExam.startedAt).getTime()) / 1000)
      : 0;
    const remainingSeconds = Math.max(0, durationSec - elapsedSec);

    return reply.send({
      success: true,
      data: {
        studentExamId: studentExam.id,
        status: studentExam.status,
        startedAt: studentExam.startedAt,
        durationMin: session.durationMin,
        remainingSeconds,
        sessionTitle: session.title,
        existingAnswers: studentExam.answers,
        violationCount: studentExam.violationCount,
        questions,
      },
    });
  });

  // 1b. GET EXAM SESSION (Resume & F5 Safe)
  fastify.get('/session/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.userId;
    const userRole = request.user?.role || '';

    let studentExam = await prisma.studentExam.findUnique({
      where: { id },
      include: {
        examSession: true,
        answers: true,
      },
    });

    if (!studentExam) {
      return reply.status(404).send({
        success: false,
        message: 'Sesi ujian peserta tidak ditemukan.',
      });
    }

    const isOwner = studentExam.userId === userId;
    const isAdminOrProctor = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR'].includes(userRole);

    if (!isOwner && !isAdminOrProctor) {
      return reply.status(403).send({
        success: false,
        message: 'Akses ditolak ke sesi ujian ini.',
      });
    }

    // Auto-promote to IN_PROGRESS and ensure startedAt is set if student was SCHEDULED
    if (studentExam.status === 'SCHEDULED' || (!studentExam.startedAt && studentExam.status === 'IN_PROGRESS')) {
      studentExam = await prisma.studentExam.update({
        where: { id: studentExam.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: studentExam.startedAt || new Date(),
        },
        include: {
          examSession: true,
          answers: true,
        },
      });
    }

    const session = studentExam.examSession;
    const durationSec = session.durationMin * 60;
    const elapsedSec = studentExam.startedAt
      ? Math.floor((Date.now() - new Date(studentExam.startedAt).getTime()) / 1000)
      : 0;
    const remainingSeconds = Math.max(0, durationSec - elapsedSec);

    const questions = await getExamQuestionsForStudent(studentExam.id);

    return reply.send({
      success: true,
      data: {
        studentExamId: studentExam.id,
        status: studentExam.status,
        startedAt: studentExam.startedAt,
        durationMin: session.durationMin,
        remainingSeconds,
        sessionTitle: session.title,
        existingAnswers: studentExam.answers,
        violationCount: studentExam.violationCount,
        questions,
      },
    });
  });

  // 2. BATCH SYNC ANSWERS (Idempotent Upsert)
  fastify.put('/sync-answers', async (request, reply) => {
    const body = SyncAnswersSchema.parse(request.body);

    const session = await prisma.studentExam.findUnique({
      where: { id: body.studentExamId },
      select: { status: true, userId: true },
    });

    if (!session || session.status !== 'IN_PROGRESS') {
      return reply.status(403).send({
        success: false,
        message: 'Sesi ujian telah dikunci atau sudah dikirim.',
      });
    }

    if (session.userId !== request.user.userId) {
      return reply.status(403).send({
        success: false,
        message: 'Akses ditolak.',
      });
    }

    // Execute batch upsert inside transaction
    await prisma.$transaction(
      body.answers.map((ans) =>
        prisma.answerLog.upsert({
          where: {
            studentExamId_questionId: {
              studentExamId: body.studentExamId,
              questionId: ans.questionId,
            },
          },
          update: {
            selectedOption: ans.selectedOption,
            isFlagged: ans.isFlagged,
          },
          create: {
            studentExamId: body.studentExamId,
            questionId: ans.questionId,
            selectedOption: ans.selectedOption,
            isFlagged: ans.isFlagged,
          },
        })
      )
    );

    return reply.send({
      success: true,
      status: 'SYNCED',
      syncedCount: body.answers.length,
      timestamp: Date.now(),
    });
  });

  // 3. SUBMIT EXAM & AUTO GRADE (With IDOR Protection)
  fastify.post('/submit', async (request, reply) => {
    const body = SubmitExamSchema.parse(request.body);

    const existingExam = await prisma.studentExam.findUnique({
      where: { id: body.studentExamId },
    });

    if (!existingExam) {
      return reply.status(404).send({
        success: false,
        message: 'Data ujian peserta tidak ditemukan.',
      });
    }

    const isOwner = existingExam.userId === request.user.userId;
    const isAdminOrProctor = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR'].includes(request.user?.role || '');

    if (!isOwner && !isAdminOrProctor) {
      return reply.status(403).send({
        success: false,
        message: 'Akses ditolak. Anda tidak berhak mengumpulkan ujian peserta lain.',
      });
    }

    // If already submitted, return current score without error
    if (existingExam.status === 'SUBMITTED' || existingExam.status === 'FORCE_SUBMITTED') {
      return reply.send({
        success: true,
        message: 'Ujian sudah diselesaikan sebelumnya.',
        result: {
          scoreListening: existingExam.scoreListening,
          scoreStructure: existingExam.scoreStructure,
          scoreReading: existingExam.scoreReading,
          totalScore: existingExam.totalScore,
          submittedAt: existingExam.submittedAt,
        },
      });
    }

    const result = await calculateEptScore(prisma, body.studentExamId);

    return reply.send({
      success: true,
      message: 'Ujian berhasil dikirim dan dinilai.',
      result: {
        scoreListening: result.scoreListening,
        scoreStructure: result.scoreStructure,
        scoreReading: result.scoreReading,
        totalScore: result.totalScore,
        submittedAt: result.submittedAt,
      },
    });
  });

  // 4. MY EXAMS & SCORE HISTORY
  fastify.get('/my-exams', async (request, reply) => {
    const userId = request.user.userId;

    const exams = await prisma.studentExam.findMany({
      where: { userId },
      include: {
        examSession: {
          select: { title: true, token: true, startTime: true },
        },
        certificate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: exams,
    });
  });

  // 5. ADMIN ALL RESULTS LISTING (Modul 11 & 12)
  fastify.get('/results', async (request, reply) => {
    const userRole = request.user?.role || '';
    const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE'];
    if (!allowed.includes(userRole)) {
      return reply.status(403).send({ success: false, message: 'Akses ditolak' });
    }

    const { search, sessionId, status, limit = 100 } = request.query as any;

    const where: any = {};
    if (sessionId) where.examSessionId = sessionId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search } } },
        { user: { identityNumber: { contains: search } } },
        { examSession: { title: { contains: search } } },
      ];
    }

    const results = await prisma.studentExam.findMany({
      where,
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            identityNumber: true,
            email: true,
            prodi: true,
            faculty: true,
          },
        },
        examSession: {
          select: { id: true, title: true, startTime: true },
        },
        certificate: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: results,
    });
  });

  // 6. MANUAL SCORE OVERRIDE (Modul 11: Koreksi Manual)
  fastify.put('/results/:id/override', async (request, reply) => {
    const userRole = request.user?.role || '';
    const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'];
    if (!allowed.includes(userRole)) {
      return reply.status(403).send({ success: false, message: 'Hanya Admin yang dapat mengoreksi/mengubah nilai' });
    }

    const { id } = request.params as { id: string };
    const { scoreListening, scoreStructure, scoreReading, totalScore } = request.body as any;

    const existing = await prisma.studentExam.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return reply.status(404).send({ success: false, message: 'Data hasil ujian tidak ditemukan' });
    }

    const updatedListening = scoreListening !== undefined ? Number(scoreListening) : (existing.scoreListening || 0);
    const updatedStructure = scoreStructure !== undefined ? Number(scoreStructure) : (existing.scoreStructure || 0);
    const updatedReading = scoreReading !== undefined ? Number(scoreReading) : (existing.scoreReading || 0);

    // Recalculate total if not specified
    const computedTotal = totalScore !== undefined
      ? Number(totalScore)
      : Math.round(((updatedListening + updatedStructure + updatedReading) * 10) / 3);

    const updated = await prisma.studentExam.update({
      where: { id },
      data: {
        scoreListening: updatedListening,
        scoreStructure: updatedStructure,
        scoreReading: updatedReading,
        totalScore: computedTotal,
      },
    });

    await createAuditLog({
      userId: request.user.userId,
      userName: request.user.email || 'Admin',
      userRole,
      action: 'PUBLISH_NILAI',
      targetModule: 'Penilaian',
      details: `Koreksi manual nilai peserta ${existing.user.fullName} (${existing.user.identityNumber}): L=${updatedListening}, S=${updatedStructure}, R=${updatedReading}, Total=${computedTotal}`,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Nilai ujian berhasil diperbarui!',
      data: updated,
    });
  });

  // 7. SCORE CONVERSION TABLE GET/PUT (Modul 15: Konversi Nilai)
  fastify.get('/conversions', async (request, reply) => {
    const conversions = await prisma.scoreConversion.findMany({
      orderBy: [{ section: 'asc' }, { rawScore: 'asc' }],
    });
    return reply.send({ success: true, data: conversions });
  });

  fastify.put('/conversions', async (request, reply) => {
    const userRole = request.user?.role || '';
    if (!['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'].includes(userRole)) {
      return reply.status(403).send({ success: false, message: 'Akses ditolak' });
    }

    const { conversions } = request.body as { conversions: Array<{ section: string; rawScore: number; scaledScore: number }> };
    if (!Array.isArray(conversions)) {
      return reply.status(400).send({ success: false, message: 'Data konversi tidak valid' });
    }

    await prisma.$transaction(
      conversions.map((c) =>
        prisma.scoreConversion.upsert({
          where: {
            section_rawScore: {
              section: c.section as any,
              rawScore: c.rawScore,
            },
          },
          update: { scaledScore: c.scaledScore },
          create: {
            section: c.section as any,
            rawScore: c.rawScore,
            scaledScore: c.scaledScore,
          },
        })
      )
    );

    await createAuditLog({
      userId: request.user.userId,
      userName: request.user.email || 'Admin',
      userRole,
      action: 'PERUBAHAN_DATA',
      targetModule: 'Pengaturan Sistem',
      details: 'Memperbarui tabel konversi skor EPT',
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'Tabel konversi nilai berhasil diperbarui' });
  });

  // 8. LOG ANTI-CHEAT VIOLATION (Tab switching & Proctoring alert)
  fastify.post('/log-violation', async (request, reply) => {
    const { studentExamId, reason, count } = request.body as any;

    if (studentExamId) {
      const studentExam = await prisma.studentExam.findUnique({
        where: { id: studentExamId },
      });

      if (studentExam && (studentExam.userId === request.user.userId || ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR'].includes(request.user?.role || ''))) {
        const newCount = Number(count) || studentExam.violationCount + 1;
        await prisma.studentExam.update({
          where: { id: studentExamId },
          data: { violationCount: newCount },
        });

        await createAuditLog({
          userId: request.user.userId,
          userName: request.user.email || 'Peserta',
          userRole: request.user.role,
          action: 'PELANGGARAN_PROCTORING',
          targetModule: 'Proctoring',
          details: `Pelanggaran Anti-Cheat #${newCount} pada ujian (${studentExamId}): ${reason}`,
          ipAddress: request.ip,
        });
      }
    }

    return reply.send({ success: true, message: 'Pelanggaran anti-cheat dicatat' });
  });
}
