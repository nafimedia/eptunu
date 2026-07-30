import { FastifyRequest, FastifyReply } from 'fastify';

export interface JwtPayload {
  userId: string;
  identityNumber?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Token missing' });
    }

    const token = authHeader.substring(7);
    const decoded = request.server.jwt.verify<JwtPayload>(token);
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
}
