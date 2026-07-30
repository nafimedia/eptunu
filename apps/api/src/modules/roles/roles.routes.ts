import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';

const db = prisma as any;

// 1. Definition of all System Permissions
export const SYSTEM_PERMISSIONS = [
  { id: 'system.manage', name: 'Manajemen Sistem', group: 'Sistem', description: 'Pengaturan penuh sistem & backup' },
  { id: 'users.manage', name: 'Manajemen Pengguna', group: 'Pengguna', description: 'Membuat, mengedit, & mereset akun' },
  { id: 'roles.manage', name: 'Manajemen Role', group: 'Pengguna', description: 'Pengaturan matriks hak akses' },
  { id: 'sessions.manage', name: 'Kelola Jadwal & Periode', group: 'Ujian', description: 'Membuat periode EPT & token' },
  { id: 'questions.create', name: 'Buat Bank Soal', group: 'Soal', description: 'Penyusunan soal Listening, Structure, Reading' },
  { id: 'questions.review', name: 'Review & Validasi Soal', group: 'Soal', description: 'Validasi & approval draft soal' },
  { id: 'exams.proctor', name: 'Pengawasan Ujian', group: 'Ujian', description: 'Monitoring real-time, reset sesi, tambahan waktu' },
  { id: 'exams.take', name: 'Mengikuti Ujian', group: 'Peserta', description: 'Akses CBT exam engine' },
  { id: 'certificates.issue', name: 'Cetak Sertifikat', group: 'Hasil', description: 'Penerbitan & penandatanganan sertifikat' },
  { id: 'reports.view', name: 'Laporan & Analytics', group: 'Laporan', description: 'Melihat statistik & grafik kelulusan' },
  { id: 'audit.view', name: 'Audit Log', group: 'Sistem', description: 'Melihat log aktivitas pengguna' },
];

// 2. Permission Mapping per Role
export const ROLE_DETAILS: Record<string, { name: string; description: string; permissions: string[] }> = {
  SUPER_ADMIN: {
    name: 'Super Administrator',
    description: 'Pengelola penuh sistem EPTUNU, manajemen pengguna, hak akses, & setting global.',
    permissions: SYSTEM_PERMISSIONS.map((p) => p.id),
  },
  ADMIN_EPT: {
    name: 'Admin EPT / UPT Bahasa',
    description: 'Operator utama UPT Bahasa. Mengelola periode ujian, paket soal, peserta, & penerbitan sertifikat.',
    permissions: [
      'users.manage',
      'sessions.manage',
      'questions.create',
      'questions.review',
      'exams.proctor',
      'certificates.issue',
      'reports.view',
    ],
  },
  QUESTION_AUTHOR: {
    name: 'Penyusun Soal (Author)',
    description: 'Fokus membuat & menyusun bank soal Listening (MP3), Structure, & Reading passage.',
    permissions: ['questions.create'],
  },
  VALIDATOR: {
    name: 'Validator Soal (Reviewer)',
    description: 'Meninjau, menyetujui (approve), atau menolak (reject) draft soal dengan catatan revisi.',
    permissions: ['questions.review'],
  },
  PROCTOR: {
    name: 'Pengawas Ujian (Proctor)',
    description: 'Memantau pelaksanaan ujian CBT secara real-time, reset sesi, & menangani pelanggaran.',
    permissions: ['exams.proctor'],
  },
  STUDENT: {
    name: 'Peserta Ujian (Student)',
    description: 'Mengikuti ujian CBT, melihat riwayat nilai TOEFL (310-677), & mengunduh sertifikat.',
    permissions: ['exams.take'],
  },
  EXECUTIVE: {
    name: 'Pimpinan (Executive)',
    description: 'Akses read-only ke dashboard statistik, rekap nilai per Fakultas/Prodi, & grafik kelulusan.',
    permissions: ['reports.view'],
  },
};

export async function rolesRoutes(fastify: FastifyInstance) {
  // Public or Authenticated List of Roles
  fastify.get('/', async (request, reply) => {
    // Count active users per role from Database
    const userCounts = await db.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });

    const countsMap: Record<string, number> = {};
    userCounts.forEach((uc: any) => {
      countsMap[uc.role] = uc._count._all;
    });

    const rolesList = Object.keys(ROLE_DETAILS).map((roleKey) => {
      const details = ROLE_DETAILS[roleKey];
      return {
        id: roleKey,
        role: roleKey,
        name: details.name,
        description: details.description,
        permissions: details.permissions,
        userCount: countsMap[roleKey] || 0,
      };
    });

    return reply.send({
      success: true,
      data: rolesList,
      roles: rolesList,
      permissions: SYSTEM_PERMISSIONS,
    });
  });

  // System Permissions List
  fastify.get('/permissions', async (request, reply) => {
    return reply.send({
      success: true,
      data: SYSTEM_PERMISSIONS,
    });
  });

  // Assign/Update User Role Endpoint (Super Admin & Admin EPT)
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);

    protectedRoutes.put('/user-role', async (request, reply) => {
      const currentUserRole = request.user?.role || '';
      if (currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'ADMIN_EPT') {
        return reply.status(403).send({ success: false, message: 'Hanya Super Admin atau Admin EPT yang dapat mengubah role' });
      }

      const { userId, newRole } = request.body as { userId: string; newRole: string };

      if (!userId || !newRole) {
        return reply.status(400).send({ success: false, message: 'UserId dan newRole valid wajib diisi' });
      }

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      return reply.send({
        success: true,
        message: `Role pengguna ${updatedUser.fullName} berhasil diperbarui menjadi ${ROLE_DETAILS[newRole]?.name || newRole}`,
        data: updatedUser,
      });
    });
  });
}
