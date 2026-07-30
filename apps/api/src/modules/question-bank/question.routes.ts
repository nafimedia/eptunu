import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';

const db = prisma as any;

export async function questionRoutes(fastify: FastifyInstance) {
  // 1. AUDIO STREAMING ENDPOINT WITH HTTP RANGE SUPPORT (206 Partial Content)
  fastify.get('/audio/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };

    const audioDir = path.resolve(__dirname, '../../../storage/audio');
    const filePath = path.join(audioDir, filename);

    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ success: false, message: 'File audio tidak ditemukan' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });

      reply.raw.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      });

      return reply.send(file);
    } else {
      reply.raw.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });

      return reply.send(fs.createReadStream(filePath));
    }
  });

  // Protected Question Bank Endpoints
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);
    protectedRoutes.addHook('preHandler', hasRole(['SUPER_ADMIN', 'ADMIN_EPT', 'QUESTION_AUTHOR', 'VALIDATOR']));

    // List all questions with filters
    protectedRoutes.get('/', async (request, reply) => {
      const { section, difficulty, status, search } = request.query as any;

      const where: any = {};
      if (section) where.section = section;
      if (difficulty) where.difficulty = difficulty;
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { questionText: { contains: search } },
          { skillTag: { contains: search } },
          { explanation: { contains: search } },
        ];
      }

      const questions = await db.question.findMany({
        where,
        include: { passage: true, author: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, data: questions });
    });

    // List Passages for Reading section
    protectedRoutes.get('/passages', async (request, reply) => {
      const passages = await db.passage.findMany({
        include: { questions: true },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, data: passages });
    });

    // Create Passage for Reading section
    protectedRoutes.post('/passages', async (request, reply) => {
      const { title, content } = request.body as any;
      if (!content) return reply.status(400).send({ success: false, message: 'Teks bacaan (content) wajib diisi' });

      const passage = await db.passage.create({
        data: { title, content },
      });
      return reply.status(201).send({ success: true, message: 'Reading Passage berhasil dibuat', data: passage });
    });

    // Create New Question (Listening, Structure, or Reading)
    protectedRoutes.post('/', async (request, reply) => {
      const userRole = request.user?.role || '';
      const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'QUESTION_AUTHOR', 'VALIDATOR'];
      if (!allowed.includes(userRole)) {
        return reply.status(403).send({ success: false, message: 'Akses ditolak' });
      }

      const {
        section,
        listeningPart,
        passageId,
        audioUrl,
        questionText,
        options,
        correctOption,
        explanation,
        skillTag,
        difficulty = 'MEDIUM',
        status = 'IN_REVIEW',
      } = request.body as any;

      if (!section || !questionText || !options || !correctOption) {
        return reply.status(400).send({ success: false, message: 'Section, Soal, Opsi A/B/C/D, dan Kunci Jawaban wajib diisi' });
      }

      const question = await db.question.create({
        data: {
          section,
          listeningPart: listeningPart || null,
          passageId: passageId || null,
          audioUrl: audioUrl || null,
          questionText,
          options,
          correctOption,
          explanation: explanation || null,
          skillTag: skillTag || null,
          difficulty,
          status,
          authorId: request.user?.userId || null,
        },
      });

      return reply.status(201).send({ success: true, message: 'Soal berhasil ditambahkan ke bank soal', data: question });
    });

    // Update Question
    protectedRoutes.put('/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const question = await db.question.findUnique({ where: { id } });
      if (!question) return reply.status(404).send({ success: false, message: 'Soal tidak ditemukan' });

      const updatedQuestion = await db.question.update({
        where: { id },
        data: {
          section: body.section || question.section,
          listeningPart: body.listeningPart !== undefined ? body.listeningPart : question.listeningPart,
          passageId: body.passageId !== undefined ? body.passageId : question.passageId,
          audioUrl: body.audioUrl !== undefined ? body.audioUrl : question.audioUrl,
          questionText: body.questionText || question.questionText,
          options: body.options || question.options,
          correctOption: body.correctOption || question.correctOption,
          explanation: body.explanation !== undefined ? body.explanation : question.explanation,
          skillTag: body.skillTag !== undefined ? body.skillTag : question.skillTag,
          difficulty: body.difficulty || question.difficulty,
          status: body.status || question.status,
        },
      });

      return reply.send({ success: true, message: 'Soal berhasil diperbarui', data: updatedQuestion });
    });

    // Review Question Workflow (Validator & Admin)
    protectedRoutes.put('/:id/review', async (request, reply) => {
      const userRole = request.user?.role || '';
      const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'VALIDATOR'];
      if (!allowed.includes(userRole)) {
        return reply.status(403).send({ success: false, message: 'Hanya Validator atau Admin yang dapat memvalidasi soal' });
      }

      const { id } = request.params as { id: string };
      const { status, reviewNotes } = request.body as { status: 'APPROVED' | 'REJECTED' | 'IN_REVIEW'; reviewNotes?: string };

      if (!status || !['APPROVED', 'REJECTED', 'IN_REVIEW'].includes(status)) {
        return reply.status(400).send({ success: false, message: 'Status validasi tidak valid' });
      }

      const updatedQuestion = await db.question.update({
        where: { id },
        data: {
          status,
          reviewNotes: reviewNotes || null,
        },
      });

      return reply.send({
        success: true,
        message: `Status soal berhasil diubah menjadi '${status}'`,
        data: updatedQuestion,
      });
    });

    // Batch Bulk Review Questions Workflow (Validator & Admin)
    protectedRoutes.post('/batch-review', async (request, reply) => {
      const userRole = request.user?.role || '';
      const allowed = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'VALIDATOR'];
      if (!allowed.includes(userRole)) {
        return reply.status(403).send({ success: false, message: 'Hanya Validator atau Admin yang dapat memvalidasi soal' });
      }

      const { ids, status, reviewNotes } = request.body as { ids: string[]; status: 'APPROVED' | 'REJECTED' | 'IN_REVIEW'; reviewNotes?: string };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ success: false, message: 'Pilih minimal satu soal untuk divalidasi massal' });
      }

      if (!status || !['APPROVED', 'REJECTED', 'IN_REVIEW'].includes(status)) {
        return reply.status(400).send({ success: false, message: 'Status validasi tidak valid' });
      }

      await db.question.updateMany({
        where: { id: { in: ids } },
        data: {
          status,
          reviewNotes: reviewNotes || null,
        },
      });

      return reply.send({
        success: true,
        message: `Berhasil mengubah status ${ids.length} soal menjadi '${status}'`,
        count: ids.length,
      });
    });

    // Batch Import Questions (Excel / CSV)
    protectedRoutes.post('/import-excel', async (request, reply) => {
      const { questions } = request.body as { questions: any[] };

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return reply.status(400).send({ success: false, message: 'Data soal import wajib berupa array tak kosong' });
      }

      let importedCount = 0;
      for (const item of questions) {
        if (!item.section || !item.questionText || !item.correctOption) continue;

        const options = [
          { id: 'A', text: item.optionA || item.options?.[0]?.text || '' },
          { id: 'B', text: item.optionB || item.options?.[1]?.text || '' },
          { id: 'C', text: item.optionC || item.options?.[2]?.text || '' },
          { id: 'D', text: item.optionD || item.options?.[3]?.text || '' },
        ];

        await db.question.create({
          data: {
            section: item.section,
            listeningPart: item.listeningPart || null,
            audioUrl: item.audioUrl || null,
            questionText: item.questionText,
            options,
            correctOption: item.correctOption.toUpperCase(),
            explanation: item.explanation || null,
            skillTag: item.skillTag || null,
            difficulty: item.difficulty || 'MEDIUM',
            status: 'APPROVED',
            authorId: request.user?.userId || null,
          },
        });
        importedCount++;
      }

      return reply.send({
        success: true,
        message: `Berhasil mengimpor ${importedCount} soal ke bank soal EPTUNU`,
        importedCount,
      });
    });

    // Upload Listening MP3 Audio File
    protectedRoutes.post('/upload-audio', async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, message: 'File audio wajib diunggah' });
      }

      const audioDir = path.resolve(__dirname, '../../../storage/audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const filename = `listening_${Date.now()}_${data.filename.replace(/\s+/g, '_')}`;
      const savePath = path.join(audioDir, filename);

      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(savePath);
        data.file.pipe(writeStream);
        writeStream.on('finish', () => resolve(true));
        writeStream.on('error', reject);
      });

      const audioUrl = `/api/v1/questions/audio/${filename}`;

      return reply.send({
        success: true,
        message: 'File audio MP3 berhasil diunggah',
        audioUrl,
        filename,
      });
    });

    // Delete Question
    protectedRoutes.delete('/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.question.delete({ where: { id } });
      return reply.send({ success: true, message: 'Soal berhasil dihapus dari bank soal' });
    });
  });
}
