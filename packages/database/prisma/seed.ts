import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Permissions
  const permissionsData = [
    { name: 'users:read', action: 'read', resource: 'users', description: 'View users list and details' },
    { name: 'users:create', action: 'create', resource: 'users', description: 'Create new user accounts' },
    { name: 'users:update', action: 'update', resource: 'users', description: 'Update existing user accounts' },
    { name: 'users:delete', action: 'delete', resource: 'users', description: 'Delete user accounts' },
    { name: 'roles:read', action: 'read', resource: 'roles', description: 'View roles and permissions' },
    { name: 'roles:manage', action: 'manage', resource: 'roles', description: 'Create, update, and assign permissions to roles' },
    { name: 'audit:read', action: 'read', resource: 'audit', description: 'View system audit logs' },
    { name: 'notifications:read', action: 'read', resource: 'notifications', description: 'View and mark notifications' },
    { name: 'dashboard:read', action: 'read', resource: 'dashboard', description: 'Access admin dashboard' },
  ];

  const permissions = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    permissions.push(perm);
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // 2. Seed Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Full system control with all permissions',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with management permissions',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Standard application user',
    },
  });

  console.log('✅ Created default roles: SUPER_ADMIN, ADMIN, USER');

  // 3. Assign Permissions to Roles
  // SUPER_ADMIN gets all permissions
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // ADMIN gets users & dashboard permissions
  const adminPerms = permissions.filter(p => p.resource !== 'roles');
  for (const perm of adminPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // USER gets dashboard & notifications read
  const userPerms = permissions.filter(p => p.name === 'dashboard:read' || p.name === 'notifications:read');
  for (const perm of userPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: perm.id,
      },
    });
  }

  // 4. Seed Super Admin User
  const adminPasswordHash = await hashPassword('password123');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@fairuzkit.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@fairuzkit.com',
      passwordHash: adminPasswordHash,
      roleId: superAdminRole.id,
      isSystem: true,
      isActive: true,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: adminPasswordHash,
      roleId: userRole.id,
      isSystem: false,
      isActive: true,
    },
  });

  console.log('✅ Created default users: admin@fairuzkit.com & john@example.com (Password: password123)');

  // 5. Seed Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        action: 'SYSTEM_INIT',
        entity: 'System',
        details: { message: 'Database initialized and seeded' },
        ipAddress: '127.0.0.1',
        userAgent: 'StarterKit Seeder',
      },
      {
        userId: superAdmin.id,
        action: 'USER_LOGIN',
        entity: 'Auth',
        entityId: superAdmin.id,
        details: { method: 'JWT' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    ],
  });

  // 6. Seed Sample Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: superAdmin.id,
        title: 'Welcome to FairuzKit',
        message: 'Selamat datang di Modern FairuzKit (Fastify + SvelteKit 5 + MySQL). System setup berhasil!',
        type: 'success',
        link: '/dashboard',
      },
      {
        userId: superAdmin.id,
        title: 'Security Alert',
        message: 'Super Admin account logged in from 127.0.0.1',
        type: 'info',
        link: '/dashboard/audit-logs',
      },
    ],
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
