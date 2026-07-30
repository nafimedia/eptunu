import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { saveUploadedFile } from '../../services/storage';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, message: 'Tidak ada file yang diunggah.' });
    }

    if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        success: false,
        message: 'Format file tidak didukung. Silakan unggah gambar bertipe JPG, PNG, WEBP, atau GIF.',
      });
    }

    const buffer = await data.toBuffer();
    const fileResult = await saveUploadedFile(data.filename, buffer);

    return reply.send({
      success: true,
      message: 'File foto berhasil diunggah!',
      url: fileResult.url,
      filename: data.filename,
      mimetype: data.mimetype,
    });
  });
}
