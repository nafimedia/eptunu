import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

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

    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or parameters',
        details: formattedDetails,
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
        message: error.message || 'Authentication required',
      },
    });
  }

  if (statusCode === 403) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: error.message || 'You do not have permission to access this resource',
      },
    });
  }

  if (statusCode === 404) {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message || 'Resource not found',
      },
    });
  }

  if (statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    });
  }

  // Generic 500 Internal Server Error
  return reply.status(statusCode).send({
    success: false,
    error: {
      code: (error as FastifyError).code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 ? 'An internal server error occurred' : error.message,
    },
  });
}
