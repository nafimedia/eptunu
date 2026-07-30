import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', hasRole(['SUPER_ADMIN', 'ADMIN_EPT', 'EXECUTIVE', 'PROCTOR']));

  // 1. GET AGGREGATED ANALYTICS & REPORTS
  fastify.get('/analytics', async (request, reply) => {
    const { faculty, prodi, sessionTitle, startDate, endDate } = request.query as any;

    // Fetch system settings to know passing score
    const settings = await prisma.systemSetting.findFirst() || { passingScore: 450 };
    const passingScore = settings.passingScore || 450;

    const where: any = {
      status: { in: ['SUBMITTED', 'FORCE_SUBMITTED'] },
    };

    if (faculty) where.user = { faculty };
    if (prodi) where.user = { ...where.user, prodi };
    if (sessionTitle) where.examSession = { title: { contains: sessionTitle } };

    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) where.submittedAt.lte = new Date(endDate);
    }

    const studentExams = await prisma.studentExam.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            identityNumber: true,
            faculty: true,
            prodi: true,
          },
        },
        examSession: {
          select: { id: true, title: true, startTime: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const totalTakers = studentExams.length;
    let totalPassed = 0;
    let sumListening = 0;
    let sumStructure = 0;
    let sumReading = 0;
    let sumTotal = 0;

    const facultyBreakdown: Record<string, { count: number; passed: number; totalScore: number }> = {};
    const prodiBreakdown: Record<string, { count: number; passed: number; totalScore: number }> = {};
    const monthlySummary: Record<string, { total: number; passed: number; avgScore: number }> = {};

    studentExams.forEach((exam) => {
      const isPassed = (exam.totalScore || 0) >= passingScore;
      if (isPassed) totalPassed++;

      const l = exam.scoreListening || 0;
      const s = exam.scoreStructure || 0;
      const r = exam.scoreReading || 0;
      const t = exam.totalScore || 0;

      sumListening += l;
      sumStructure += s;
      sumReading += r;
      sumTotal += t;

      // Faculty stats
      const facName = exam.user.faculty || 'Lainnya / Umum';
      if (!facultyBreakdown[facName]) facultyBreakdown[facName] = { count: 0, passed: 0, totalScore: 0 };
      facultyBreakdown[facName].count++;
      if (isPassed) facultyBreakdown[facName].passed++;
      facultyBreakdown[facName].totalScore += t;

      // Prodi stats
      const prodiName = exam.user.prodi || 'Lainnya / Umum';
      if (!prodiBreakdown[prodiName]) prodiBreakdown[prodiName] = { count: 0, passed: 0, totalScore: 0 };
      prodiBreakdown[prodiName].count++;
      if (isPassed) prodiBreakdown[prodiName].passed++;
      prodiBreakdown[prodiName].totalScore += t;

      // Monthly stats
      if (exam.submittedAt) {
        const monthKey = `${exam.submittedAt.getFullYear()}-${String(exam.submittedAt.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlySummary[monthKey]) monthlySummary[monthKey] = { total: 0, passed: 0, avgScore: 0 };
        monthlySummary[monthKey].total++;
        if (isPassed) monthlySummary[monthKey].passed++;
        monthlySummary[monthKey].avgScore += t;
      }
    });

    // Final monthly averages
    Object.keys(monthlySummary).forEach((m) => {
      monthlySummary[m].avgScore = monthlySummary[m].total > 0 ? Math.round(monthlySummary[m].avgScore / monthlySummary[m].total) : 0;
    });

    return reply.send({
      success: true,
      data: {
        overview: {
          totalTakers,
          passedCount: totalPassed,
          failedCount: totalTakers - totalPassed,
          passRate: totalTakers > 0 ? Math.round((totalPassed / totalTakers) * 100) : 0,
          avgListening: totalTakers > 0 ? Math.round(sumListening / totalTakers) : 0,
          avgStructure: totalTakers > 0 ? Math.round(sumStructure / totalTakers) : 0,
          avgReading: totalTakers > 0 ? Math.round(sumReading / totalTakers) : 0,
          avgTotal: totalTakers > 0 ? Math.round(sumTotal / totalTakers) : 0,
          passingScoreThreshold: passingScore,
        },
        facultyBreakdown,
        prodiBreakdown,
        monthlySummary,
        recentExams: studentExams.slice(0, 100).map((e) => ({
          id: e.id,
          fullName: e.user.fullName,
          identityNumber: e.user.identityNumber,
          faculty: e.user.faculty,
          prodi: e.user.prodi,
          sessionTitle: e.examSession.title,
          submittedAt: e.submittedAt,
          scoreListening: e.scoreListening,
          scoreStructure: e.scoreStructure,
          scoreReading: e.scoreReading,
          totalScore: e.totalScore,
          isPassed: (e.totalScore || 0) >= passingScore,
        })),
      },
    });
  });

  // 2. EXPORT REPORT TO CSV / EXCEL
  fastify.get('/export', async (request, reply) => {
    const { faculty, prodi, sessionTitle, format } = request.query as any;

    const settings = await prisma.systemSetting.findFirst() || { passingScore: 450 };
    const passingScore = settings.passingScore || 450;

    const where: any = {
      status: { in: ['SUBMITTED', 'FORCE_SUBMITTED'] },
    };
    if (faculty) where.user = { faculty };
    if (prodi) where.user = { ...where.user, prodi };
    if (sessionTitle) where.examSession = { title: { contains: sessionTitle } };

    const studentExams = await prisma.studentExam.findMany({
      where,
      include: {
        user: true,
        examSession: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    const rows = studentExams.map((e) => {
      const isPassed = (e.totalScore || 0) >= passingScore;
      return {
        identityNumber: e.user.identityNumber,
        fullName: e.user.fullName,
        email: e.user.email,
        faculty: e.user.faculty || '-',
        prodi: e.user.prodi || '-',
        sessionTitle: e.examSession.title,
        submittedAt: e.submittedAt ? e.submittedAt.toISOString().slice(0, 19).replace('T', ' ') : '-',
        scoreListening: e.scoreListening || 0,
        scoreStructure: e.scoreStructure || 0,
        scoreReading: e.scoreReading || 0,
        totalScore: e.totalScore || 0,
        status: isPassed ? 'LULUS' : 'TIDAK LULUS',
      };
    });

    if (format === 'csv') {
      const headers = ['NIM/NIP', 'Nama Lengkap', 'Email', 'Fakultas', 'Program Studi', 'Sesi Ujian', 'Waktu Submit', 'Listening', 'Structure', 'Reading', 'Total Skor EPT', 'Status'];
      const csvRows = [headers.join(',')];

      for (const r of rows) {
        const line = [
          `"${r.identityNumber}"`,
          `"${r.fullName}"`,
          `"${r.email}"`,
          `"${r.faculty}"`,
          `"${r.prodi}"`,
          `"${r.sessionTitle}"`,
          `"${r.submittedAt}"`,
          r.scoreListening,
          r.scoreStructure,
          r.scoreReading,
          r.totalScore,
          `"${r.status}"`
        ];
        csvRows.push(line.join(','));
      }

      const csvContent = csvRows.join('\n');
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="Rekap_Nilai_EPTUNU.csv"');
      return reply.send(csvContent);
    }

    return reply.send({
      success: true,
      data: rows,
    });
  });
}
