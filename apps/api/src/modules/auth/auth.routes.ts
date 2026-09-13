import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@starter-kit/database';
import { comparePassword, hashPassword } from '../../services/hash';
import { authenticate } from '../../middleware/auth';

const loginSchema = z.object({
  identityNumber: z.string().min(1, 'NIM / NIP / Email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const registerSchema = z.object({
  identityNumber: z.string().min(3, 'NIM / NIP / No. Identitas minimal 3 karakter'),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  faculty: z.string().optional().nullable(),
  prodi: z.string().optional().nullable(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // 1. REGISTER MAHASISWA / PESERTA BARU
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { identityNumber: body.identityNumber },
          { email: body.email }
        ]
      }
    });

    if (existing) {
      return reply.status(400).send({
        success: false,
        message: 'NIM/NIP atau Email sudah terdaftar dalam sistem.',
      });
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        identityNumber: body.identityNumber.trim(),
        fullName: body.fullName.trim(),
        email: body.email.trim().toLowerCase(),
        passwordHash,
        role: 'STUDENT',
        faculty: body.faculty || null,
        prodi: body.prodi || null,
      }
    });

    const accessToken = fastify.jwt.sign(
      {
        userId: user.id,
        identityNumber: user.identityNumber,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      { expiresIn: '1d' }
    );

    return reply.status(201).send({
      success: true,
      message: 'Pendaftaran Akun Peserta EPT Berhasil!',
      token: accessToken,
      user: {
        id: user.id,
        identityNumber: user.identityNumber,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        prodi: user.prodi,
        faculty: user.faculty,
      },
    });
  });
  // 1. LOGIN (Supports NIM / NIP or Email)
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { identityNumber: body.identityNumber },
          { email: body.identityNumber }
        ]
      }
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'NIM/NIP atau password salah.',
      });
    }

    const { isValid } = await comparePassword(body.password, user.passwordHash);

    if (!isValid) {
      return reply.status(401).send({
        success: false,
        message: 'NIM/NIP atau password salah.',
      });
    }

    const accessToken = fastify.jwt.sign(
      {
        userId: user.id,
        identityNumber: user.identityNumber,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      { expiresIn: '1d' }
    );

    return reply.send({
      success: true,
      message: 'Login berhasil!',
      token: accessToken,
      user: {
        id: user.id,
        identityNumber: user.identityNumber,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        prodi: user.prodi,
        faculty: user.faculty,
      },
    });
  });

  // 2. GET CURRENT USER (ME)
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return reply.status(401).send({ success: false, message: 'Pengguna tidak ditemukan atau sesi telah berakhir' });
    }

    return reply.send({
      success: true,
      user: {
        id: user.id,
        identityNumber: user.identityNumber,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        prodi: user.prodi,
        faculty: user.faculty,
        createdAt: user.createdAt,
      },
    });
  });

  // 3. FORGOT PASSWORD REQUEST
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = (request.body || {}) as { email?: string };

    if (!email || !email.includes('@')) {
      return reply.status(400).send({
        success: false,
        message: 'Alamat email wajib diisi dengan format yang benar.',
      });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return reply.send({
        success: true,
        message: 'Instruksi reset kata sandi telah dikirimkan ke email Anda jika terdaftar.',
      });
    }

    try {
      const { sendEmail } = await import('../../services/mailer');
      await sendEmail({
        to: user.email,
        subject: '[EPTUNU CBT] Permintaan Reset Kata Sandi Akun',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; padding: 24px;">
            <h2 style="color: #34d399; margin: 0 0 16px 0;">UPT BAHASA UNU PURWOKERTO</h2>
            <p>Halo <strong>${user.fullName}</strong> (${user.identityNumber}),</p>
            <p style="color: #cbd5e1;">Kami menerima permintaan untuk mereset kata sandi akun EPTUNU CBT Anda.</p>
            <p style="color: #cbd5e1;">Silakan hubungi administrator UPT Bahasa atau gunakan bantuan helpdesk resmi untuk pembaruan kata sandi akun institusi.</p>
            <p style="color: #64748b; font-size: 11px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 12px;">Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan pesan ini demi keamanan akun Anda.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error('Failed to send reset email:', e);
    }

    return reply.send({
      success: true,
      message: 'Instruksi reset kata sandi telah dikirimkan ke email Anda jika terdaftar.',
    });
  });
}
