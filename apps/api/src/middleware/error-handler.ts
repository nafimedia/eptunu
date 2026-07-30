import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ApiResponse } from '../types/api-response';

export function globalErrorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    const formattedDetails = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Format payload atau parameter tidak valid',
        details: formattedDetails,
      },
    };

    return reply.status(400).send(response);
  }

  // Handle Fastify Empty JSON Body Error
  if ((error as FastifyError).code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'EMPTY_JSON_BODY',
        message: 'Body request JSON tidak boleh kosong',
      },
    });
  }

  // Handle Fastify status code errors (e.g. 401, 403, 404, 429)
  const statusCode = (error as FastifyError).statusCode || 500;

  if (statusCode === 401) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message || 'Sesi habis atau token tidak valid',
      },
    });
  }

  if (statusCode === 403) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: error.message || 'Akses ditolak untuk role pengguna ini',
      },
    });
  }

  if (statusCode === 404) {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message || 'Halaman atau resource tidak ditemukan',
      },
    });
  }

  if (statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.',
      },
    });
  }

  // Generic 500 Internal Server Error
  return reply.status(statusCode).send({
    success: false,
    error: {
      code: (error as FastifyError).code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 ? 'Terjadi kesalahan pada server' : error.message,
    },
  });
}
