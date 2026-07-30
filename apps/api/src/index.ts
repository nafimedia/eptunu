import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';

import { env } from './config/env';
import { globalErrorHandler } from './middleware/error-handler';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { rolesRoutes } from './modules/roles/roles.routes';
import { auditLogsRoutes } from './modules/audit-logs/audit-logs.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { uploadRoutes } from './modules/upload/upload.routes';

const app = fastify({ logger: true });

async function main() {
  // Global Error Handler
  app.setErrorHandler(globalErrorHandler);

  // Register Security Helmet (relax CSP for Swagger UI)
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register Cookies & JWT
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // Register Multipart File Upload
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Swagger OpenAPI Docs
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Starter Kit API Documentation',
        description: 'Fastify + SvelteKit 5 + MySQL Starter Kit REST API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Serve uploads directory
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
  });

  // Health check route
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Register Modules
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(rolesRoutes, { prefix: '/api/roles' });
  await app.register(auditLogsRoutes, { prefix: '/api/audit-logs' });
  await app.register(notificationsRoutes, { prefix: '/api/notifications' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Fastify Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`📚 Swagger OpenAPI Documentation available at http://localhost:${env.PORT}/documentation`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
