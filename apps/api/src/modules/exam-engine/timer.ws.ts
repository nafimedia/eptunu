import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';

export async function timerWebsocketRoutes(fastify: FastifyInstance) {
  fastify.get('/timer', { websocket: true }, (connection, req) => {
    const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
    const studentExamId = urlParams.get('examId');

    if (!studentExamId) {
      connection.socket.send(JSON.stringify({ type: 'ERROR', message: 'examId parameter required' }));
      connection.socket.close();
      return;
    }

    // Set heartbeat interval
    const interval = setInterval(async () => {
      try {
        const studentExam = await prisma.studentExam.findUnique({
          where: { id: studentExamId },
          include: { examSession: true },
        });

        if (!studentExam || !studentExam.startedAt) {
          connection.socket.send(JSON.stringify({ type: 'ERROR', message: 'Exam session invalid' }));
          clearInterval(interval);
          connection.socket.close();
          return;
        }

        if (studentExam.status === 'SUBMITTED' || studentExam.status === 'FORCE_SUBMITTED') {
          connection.socket.send(JSON.stringify({ type: 'FINISHED', message: 'Exam already submitted' }));
          clearInterval(interval);
          connection.socket.close();
          return;
        }

        const durationSec = studentExam.examSession.durationMin * 60;
        const elapsedSec = Math.floor((Date.now() - new Date(studentExam.startedAt).getTime()) / 1000);
        const remainingSeconds = Math.max(0, durationSec - elapsedSec);

        if (remainingSeconds <= 0) {
          connection.socket.send(JSON.stringify({ type: 'FORCE_SUBMIT', reason: 'TIME_EXPIRED' }));
          clearInterval(interval);
          connection.socket.close();
          return;
        }

        if (remainingSeconds === 300) { // 5 minutes left
          connection.socket.send(JSON.stringify({
            type: 'WARNING',
            message: 'Waktu tersisa 5 menit lagi.',
            remainingSeconds,
          }));
        } else {
          connection.socket.send(JSON.stringify({
            type: 'TICK',
            remainingSeconds,
          }));
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 5000); // Push tick every 5 seconds

    connection.socket.on('close', () => {
      clearInterval(interval);
    });

    connection.socket.on('message', (message: string) => {
      // Inbound heartbeat acknowledged
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'HEARTBEAT') {
          connection.socket.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (e) {
        // ignore invalid json
      }
    });
  });
}
