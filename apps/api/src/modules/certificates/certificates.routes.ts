import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { hasRole } from '../../middleware/rbac';
import { CertificatesService } from './certificates.service';
import { MANAGEMENT_ROLES, ADMIN_ONLY_ROLES } from '../../config/constants';

const certificateQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

const issueCertificateSchema = z.object({
  studentExamId: z.string().min(1, 'studentExamId wajib diisi'),
});

const batchZipQuerySchema = z.object({
  sessionId: z.string().optional(),
});

export async function certificatesRoutes(fastify: FastifyInstance) {
  // Public Verification Endpoint (No authentication required)
  fastify.get('/verify/:certificateNo', async (request, reply) => {
    const { certificateNo } = request.params as { certificateNo: string };
    const certData = await CertificatesService.verifyCertificate(certificateNo);

    if (!certData) {
      return reply.status(404).send({
        success: false,
        message: 'Sertifikat tidak ditemukan. Harap periksa kembali nomor sertifikat.',
      });
    }

    return reply.send({
      success: true,
      data: certData,
    });
  });

  // Protected Certificate Endpoints
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);

    // List all certificates (Admin / Proctor / Executive)
    protectedRoutes.get('/', { preHandler: [hasRole(MANAGEMENT_ROLES)] }, async (request, reply) => {
      const query = certificateQuerySchema.parse(request.query);
      const certificates = await CertificatesService.listCertificates(query.search, query.limit);

      return reply.send({ success: true, data: certificates });
    });

    // Get My Certificates (Student)
    protectedRoutes.get('/my-certificates', async (request, reply) => {
      const userId = request.user.userId;
      const certificates = await CertificatesService.getStudentCertificates(userId);

      return reply.send({ success: true, data: certificates });
    });

    // Issue New Certificate (Admin / Proctor)
    protectedRoutes.post('/issue', async (request, reply) => {
      const userRole = request.user?.role || '';
      const allowedRoles = [...MANAGEMENT_ROLES];
      if (!allowedRoles.includes(userRole as any)) {
        return reply.status(403).send({ success: false, message: 'Akses ditolak' });
      }

      const body = issueCertificateSchema.parse(request.body);

      try {
        const result = await CertificatesService.issueCertificate({
          studentExamId: body.studentExamId,
          issuerUserId: request.user.userId,
          issuerName: request.user.email || 'Admin',
          issuerRole: userRole,
          ipAddress: request.ip,
        });

        if (result.isExisting) {
          return reply.send({
            success: true,
            message: 'Sertifikat sudah pernah diterbitkan',
            data: result.certificate,
          });
        }

        return reply.status(201).send({
          success: true,
          message: 'Sertifikat berhasil diterbitkan!',
          data: result.certificate,
        });
      } catch (error: any) {
        if (error?.message?.startsWith('NOT_FOUND')) {
          return reply.status(404).send({ success: false, message: 'Data hasil ujian tidak ditemukan' });
        }
        throw error;
      }
    });

    // Batch Download All Certificates as ZIP Archive (Admin/Proctor)
    protectedRoutes.get('/batch-zip', { preHandler: [hasRole(MANAGEMENT_ROLES)] }, async (request, reply) => {
      const query = batchZipQuerySchema.parse(request.query);
      const zipBuffer = await CertificatesService.generateBatchZip(query.sessionId);

      if (!zipBuffer) {
        return reply.status(404).send({ success: false, message: 'Belum ada sertifikat yang diterbitkan.' });
      }

      reply.header('Content-Type', 'application/zip');
      reply.header('Content-Disposition', `attachment; filename="Batch_Sertifikat_EPTUNU_${Date.now()}.zip"`);
      return reply.send(zipBuffer);
    });
  });
}
