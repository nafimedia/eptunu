import fs from 'fs';
import path from 'path';

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('❌ Error: Parameter nama modul diperlukan!');
  console.log('Usage: npm run g:module <name>');
  console.log('Example: npm run g:module products');
  process.exit(1);
}

const nameLower = moduleName.toLowerCase();
const nameCapitalized = nameLower.charAt(0).toUpperCase() + nameLower.slice(1);

const rootDir = process.cwd();

// Paths
const apiModuleDir = path.join(rootDir, 'apps', 'api', 'src', 'modules', nameLower);
const apiRouteFile = path.join(apiModuleDir, `${nameLower}.routes.ts`);

const webPageDir = path.join(rootDir, 'apps', 'web', 'src', 'routes', 'dashboard', nameLower);
const webPageFile = path.join(webPageDir, '+page.svelte');

console.log(`🚀 Generasi Modul Baru: [${nameCapitalized}]...`);

// 1. Generate Fastify API Module
if (!fs.existsSync(apiModuleDir)) {
  fs.mkdirSync(apiModuleDir, { recursive: true });
}

const apiRouteTemplate = `import { FastifyInstance } from 'fastify';
import { prisma } from '@starter-kit/database';
import { authenticate } from '../../middleware/auth';
import { hasPermission } from '../../middleware/rbac';

export async function ${nameLower}Routes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/${nameLower}
  fastify.get('/', { preHandler: [hasPermission('${nameLower}:read')] }, async (request, reply) => {
    try {
      // const items = await prisma.${nameLower}.findMany();
      return reply.send({ success: true, data: [] });
    } catch (err) {
      return reply.status(500).send({ success: false, message: 'Gagal mengambil data' });
    }
  });

  // POST /api/${nameLower}
  fastify.post('/', { preHandler: [hasPermission('${nameLower}:create')] }, async (request, reply) => {
    try {
      const body = request.body as any;
      return reply.status(201).send({ success: true, message: 'Berhasil dibuat', data: body });
    } catch (err) {
      return reply.status(500).send({ success: false, message: 'Gagal menyimpan data' });
    }
  });
}
`;

fs.writeFileSync(apiRouteFile, apiRouteTemplate, 'utf-8');
console.log(`✅ File Fastify Route dibuat: apps/api/src/modules/${nameLower}/${nameLower}.routes.ts`);

// 2. Generate SvelteKit Page
if (!fs.existsSync(webPageDir)) {
  fs.mkdirSync(webPageDir, { recursive: true });
}

const webPageTemplate = `<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';

  let items: any[] = [];
  let loading = true;

  onMount(async () => {
    try {
      const res = await apiFetch('/${nameLower}');
      if (res.ok) {
        const body = await res.json();
        items = body.data || [];
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Manajemen ${nameCapitalized} - Starter Kit</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">${nameCapitalized}</h1>
      <p class="text-sm text-muted-foreground">Kelola data ${nameLower} aplikasi Anda di sini.</p>
    </div>
    <button class="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
      + Tambah ${nameCapitalized}
    </button>
  </div>

  <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
    {#if loading}
      <div class="py-12 text-center text-sm text-muted-foreground">Memuat data ${nameLower}...</div>
    {:else if items.length === 0}
      <div class="py-12 text-center text-sm text-muted-foreground">Belum ada data ${nameLower}.</div>
    {:else}
      <div class="divide-y divide-border">
        {#each items as item}
          <div class="py-3 flex items-center justify-between text-sm">
            <span>{item.name || item.id}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
`;

fs.writeFileSync(webPageFile, webPageTemplate, 'utf-8');
console.log(`✅ File SvelteKit Page dibuat: apps/web/src/routes/dashboard/${nameLower}/+page.svelte`);

console.log(`
🎉 Selesai! Langkah selanjutnya:
1. Daftarkan modul di \`apps/api/src/index.ts\`:
   import { ${nameLower}Routes } from './modules/${nameLower}/${nameLower}.routes';
   await app.register(${nameLower}Routes, { prefix: '/api/${nameLower}' });

2. Tambahkan link navigasi di \`apps/web/src/lib/components/Sidebar.svelte\`.
`);
