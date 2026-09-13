import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';
import { ReportsService } from './reports.service';
import { MANAGEMENT_ROLES } from '../../config/constants';

const analyticsQuerySchema = z.object({
  faculty: z.string().optional(),
  prodi: z.string().optional(),
  sessionTitle: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const exportQuerySchema = z.object({
  faculty: z.string().optional(),
  prodi: z.string().optional(),
  sessionTitle: z.string().optional(),
  format: z.string().optional(),
});

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', hasRole(MANAGEMENT_ROLES));

  // 1. GET AGGREGATED ANALYTICS & REPORTS
  fastify.get('/analytics', async (request, reply) => {
    const query = analyticsQuerySchema.parse(request.query);
    const data = await ReportsService.getAnalytics(query);

    return reply.send({
      success: true,
      data,
    });
  });

  // 2. EXPORT REPORT TO CSV / EXCEL
  fastify.get('/export', async (request, reply) => {
    const query = exportQuerySchema.parse(request.query);
    const result = await ReportsService.exportReport(query);

    if (result.isCsv && result.content) {
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="Rekap_Nilai_EPTUNU.csv"');
      return reply.send(result.content);
    }

    return reply.send({
      success: true,
      data: result.data,
    });
  });
}
