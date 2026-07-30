import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. LIST NOTIFICATIONS FOR LOGGED IN USER
  fastify.get('/', async (request, reply) => {
    const userId = request.user?.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return reply.send({
      notifications,
      unreadCount,
    });
  });

  // 2. MARK AS READ
  fastify.put('/:id/read', async (request, reply) => {
    const { id } = request.params as any;
    const userId = request.user?.userId;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return reply.send({ message: 'Notification marked as read' });
  });

  // 3. MARK ALL AS READ
  fastify.put('/read-all', async (request, reply) => {
    const userId = request.user?.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return reply.send({ message: 'All notifications marked as read' });
  });
}
