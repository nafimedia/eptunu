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
import websocket from '@fastify/websocket';
import path from 'path';
import fs from 'fs';

import { env } from './config/env';
import { globalErrorHandler } from './middleware/error-handler';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { examRoutes } from './modules/exam-engine/exam.routes';
import { questionRoutes } from './modules/question-bank/question.routes';
import { timerWebsocketRoutes } from './modules/exam-engine/timer.ws';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { rolesRoutes } from './modules/roles/roles.routes';
import { auditLogsRoutes } from './modules/audit-logs/audit-logs.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { masterDataRoutes } from './modules/master-data/master-data.routes';
import { examSessionsRoutes } from './modules/exam-sessions/exam-sessions.routes';
import { registrationsRoutes } from './modules/registrations/registrations.routes';
import { uploadRoutes } from './modules/upload/upload.routes';
import { certificatesRoutes } from './modules/certificates/certificates.routes';
import { reportsRoutes } from './modules/reports/reports.routes';

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

  // Register WebSocket
  await app.register(websocket);

  // Register Multipart File Upload
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Swagger OpenAPI Docs
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'EPTUNU CBT API Documentation',
        description: 'Fastify + SvelteKit 5 + MySQL EPTUNU Computer-Based Test REST & WebSocket API',
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

  // Serve storage directory for audio & certificates
  const storageDir = path.resolve(__dirname, '../storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  await app.register(fastifyStatic, {
    root: storageDir,
    prefix: '/storage/',
  });

  // Health check route
  app.get('/health', async () => ({ status: 'ok', service: 'EPTUNU CBT API', timestamp: new Date().toISOString() }));

  // Register EPTUNU Modules (/api/v1)
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(usersRoutes, { prefix: '/api/v1/users' });
  await app.register(examRoutes, { prefix: '/api/v1/exam' });
  await app.register(questionRoutes, { prefix: '/api/v1/questions' });
  await app.register(timerWebsocketRoutes, { prefix: '/ws/v1/exam' });
  await app.register(notificationsRoutes, { prefix: '/api/v1/notifications' });
  await app.register(rolesRoutes, { prefix: '/api/v1/roles' });
  await app.register(auditLogsRoutes, { prefix: '/api/v1/audit-logs' });
  await app.register(settingsRoutes, { prefix: '/api/v1/settings' });
  await app.register(masterDataRoutes, { prefix: '/api/v1/master-data' });
  await app.register(examSessionsRoutes, { prefix: '/api/v1/exam-sessions' });
  await app.register(registrationsRoutes, { prefix: '/api/v1/registrations' });
  await app.register(uploadRoutes, { prefix: '/api/v1/upload' });
  await app.register(certificatesRoutes, { prefix: '/api/v1/certificates' });
  await app.register(reportsRoutes, { prefix: '/api/v1/reports' });

  // Direct route compatibility (/api/*)
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(examRoutes, { prefix: '/api/exam' });
  await app.register(questionRoutes, { prefix: '/api/questions' });
  await app.register(notificationsRoutes, { prefix: '/api/notifications' });
  await app.register(rolesRoutes, { prefix: '/api/roles' });
  await app.register(auditLogsRoutes, { prefix: '/api/audit-logs' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
  await app.register(masterDataRoutes, { prefix: '/api/master-data' });
  await app.register(examSessionsRoutes, { prefix: '/api/exam-sessions' });
  await app.register(registrationsRoutes, { prefix: '/api/registrations' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });
  await app.register(certificatesRoutes, { prefix: '/api/certificates' });
  await app.register(reportsRoutes, { prefix: '/api/reports' });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 EPTUNU Fastify Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`📚 Swagger OpenAPI Documentation available at http://localhost:${env.PORT}/documentation`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
