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
    if (now < session.startTime || now > session.endTime) {
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
    } else if (studentExam.status === 'SUBMITTED' || studentExam.status === 'FORCE_SUBMITTED') {
      return reply.status(403).send({
        success: false,
        message: 'Anda sudah menyelesaikan ujian ini.',
      });
    } else if (studentExam.status === 'SCHEDULED') {
      studentExam = await prisma.studentExam.update({
        where: { id: studentExam.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
        include: {
          answers: true,
        },
      });
    }

    // Fetch questions with passage data
    const rawQuestions = await prisma.question.findMany({
      include: {
        passage: true,
      },
      orderBy: [
        { section: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Group questions by section for structured exam flow
    const listeningQuestions = rawQuestions.filter((q) => q.section === 'LISTENING');
    const structureQuestions = rawQuestions.filter((q) => q.section === 'STRUCTURE');
    const readingQuestions = rawQuestions.filter((q) => q.section === 'READING');

    // Deterministic Seeded Shuffle PER STUDENT EXAM (Desk-neighbor anti-cheat)
    const shuffledListening = seededShuffle(listeningQuestions, `${studentExam.id}_LISTENING`);
    const shuffledStructure = seededShuffle(structureQuestions, `${studentExam.id}_STRUCTURE`);
    const shuffledReading = seededShuffle(readingQuestions, `${studentExam.id}_READING`);

    const allShuffledQuestions = [
      ...shuffledListening,
      ...shuffledStructure,
      ...shuffledReading,
    ];

    // SECURITY DIRECTIVE: Zero exposure of correctOption to client & Shuffle Options A, B, C, D per question
    const sanitizedQuestions = allShuffledQuestions.map((q) => {
      const originalOptions = Array.isArray(q.options) ? (q.options as any[]) : [];
      const shuffledOptions = seededShuffle(originalOptions, `${studentExam.id}_${q.id}_options`);

      return {
        id: q.id,
        section: q.section,
        questionText: q.questionText,
        audioUrl: q.audioUrl,
        options: shuffledOptions,
        skillTag: q.skillTag,
        passage: q.passage ? {
          id: q.passage.id,
          title: q.passage.title,
          content: q.passage.content,
        } : null,
      };
    });

    return reply.send({
      success: true,
      data: {
        studentExamId: studentExam.id,
        status: studentExam.status,
        startedAt: studentExam.startedAt,
        durationMin: session.durationMin,
        sessionTitle: session.title,
        existingAnswers: studentExam.answers,
        questions: sanitizedQuestions,
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

  // 3. SUBMIT EXAM & AUTO GRADE
  fastify.post('/submit', async (request, reply) => {
    const body = SubmitExamSchema.parse(request.body);

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

    await createAuditLog({
      userId: request.user.userId,
      userName: request.user.email || 'Peserta',
      userRole: request.user.role,
      action: 'PELANGGARAN_PROCTORING',
      targetModule: 'Proctoring',
      details: `Pelanggaran Anti-Cheat #${count} pada ujian (${studentExamId}): ${reason}`,
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'Pelanggaran anti-cheat dicatat' });
  });
}
