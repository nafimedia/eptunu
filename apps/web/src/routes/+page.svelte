<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$stores/auth';
  import { theme, toggleTheme } from '$stores/theme';
  import {
    Sparkles,
    ArrowRight,
    Zap,
    ShieldCheck,
    Terminal,
    Database,
    Code2,
    CheckCircle2,
    Sun,
    Moon,
    LayoutDashboard,
    Cpu,
    Flame,
    Command,
    Layers,
    Star,
    ExternalLink,
    Activity,
    Lock
  } from 'lucide-svelte';

  let isLoaded = false;

  onMount(() => {
    isLoaded = true;
  });

  function navigateToApp() {
    if ($auth.isAuthenticated) {
      goto('/dashboard');
    } else {
      goto('/login');
    }
  }

  const features = [
    {
      title: 'RBAC (Role & Permission)',
      desc: 'Sistem hak akses bertingkat SUPER_ADMIN, ADMIN, USER lengkap dengan matriks izin dinamis.',
      icon: ShieldCheck,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Fastify + TypeScript Engine',
      desc: 'API Server super cepat dengan integrasi OpenAPI / Swagger UI otomatis di /documentation.',
      icon: Zap,
      color: 'from-amber-400 to-orange-500',
    },
    {
      title: 'SvelteKit 5 + Runes',
      desc: 'Frontend reactive terbaru menggunakan $state, $derived, $effect, dan Tailwind CSS.',
      icon: Flame,
      color: 'from-rose-500 to-pink-500',
    },
    {
      title: 'Command Palette (Ctrl + K)',
      desc: 'Modal pencarian dan navigasi ala Vercel / Linear untuk produktivitas maksimal.',
      icon: Command,
      color: 'from-cyan-400 to-blue-500',
    },
    {
      title: 'Prisma ORM + MySQL',
      desc: 'Manajemen database type-safe dengan seeder otomatis dan migrasi tanpa rasa sakit.',
      icon: Database,
      color: 'from-emerald-400 to-teal-500',
    },
    {
      title: 'Audit Logs & Notification Center',
      desc: 'Catatan aktivitas keamanan mutasi data dan sistem pemberitahuan real-time.',
      icon: Layers,
      color: 'from-purple-500 to-indigo-600',
    },
  ];

  const techStack = [
    { name: 'SvelteKit 5', tag: 'Frontend' },
    { name: 'Fastify', tag: 'Backend' },
    { name: 'Prisma ORM', tag: 'Database' },
    { name: 'MySQL', tag: 'Storage' },
    { name: 'Tailwind CSS', tag: 'Styling' },
    { name: 'Shadcn Svelte', tag: 'UI System' },
    { name: 'Redis', tag: 'Cache' },
    { name: 'BullMQ', tag: 'Queue' },
    { name: 'ApexCharts', tag: 'Analytics' },
    { name: 'Sonner', tag: 'Toast' },
  ];
</script>

<div class="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white relative overflow-hidden font-sans">
  <!-- Dynamic Cyber Grid Overlay with Infinite Grid Movement -->
  <div class="absolute inset-0 bg-cyber-grid animate-grid-move pointer-events-none opacity-60 z-0"></div>

  <!-- Animated Glowing Ambient Floating Orbs Across All Sections -->
  <div class="absolute -top-40 -left-40 w-[650px] h-[650px] bg-indigo-600/25 rounded-full blur-[150px] pointer-events-none animate-orb-1 z-0"></div>
  <div class="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none animate-orb-2 z-0"></div>
  <div class="absolute top-1/2 left-10 w-[550px] h-[550px] bg-pink-600/20 rounded-full blur-[140px] pointer-events-none animate-orb-1 z-0"></div>
  <div class="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[150px] pointer-events-none animate-orb-2 z-0"></div>
  <div class="absolute -bottom-40 left-1/3 w-[650px] h-[650px] bg-indigo-600/20 rounded-full blur-[160px] pointer-events-none animate-orb-1 z-0"></div>

  <!-- Header / Navigation -->
  <header class="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
      <!-- Brand Logo -->
      <a href="/" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
          <Sparkles class="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">FairuzKit</span>
          <span class="text-xs px-2 py-0.5 ml-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold">v1.0 Pro</span>
        </div>
      </a>

      <!-- Nav Links -->
      <nav class="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
        <a href="#fitur" class="hover:text-foreground transition-colors">Fitur Utama</a>
        <a href="#tech" class="hover:text-foreground transition-colors">Teknologi</a>
        <a href="#arsitektur" class="hover:text-foreground transition-colors">Arsitektur Code</a>
        <a href="http://localhost:3001/documentation" target="_blank" class="hover:text-foreground transition-colors flex items-center gap-1">
          <span>API Docs</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-3">
        <button
          on:click={toggleTheme}
          class="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-105"
        >
          {#if $theme === 'dark'}
            <Sun class="w-4 h-4 text-amber-400" />
          {:else}
            <Moon class="w-4 h-4 text-indigo-600" />
          {/if}
        </button>

        <button
          on:click={navigateToApp}
          class="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-200 flex items-center gap-2 hover:scale-105"
        >
          {#if $auth.isAuthenticated}
            <LayoutDashboard class="w-4 h-4" />
            <span>Buka Dashboard</span>
          {:else}
            <span>Masuk ke App</span>
            <ArrowRight class="w-4 h-4" />
          {/if}
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section with Animated High-Tech Showcase -->
  <section class="relative pt-12 pb-24 lg:pt-20 lg:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
      <!-- Left Column Text with Staggered Entrance Animations -->
      <div class="lg:col-span-7 space-y-8 text-center lg:text-left transition-all duration-700 {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">
        <!-- Top Pill Badge with Animated Pulse & Shimmer -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-400 shadow-md backdrop-blur-md hover:border-indigo-400/60 transition-colors">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Fastify 5 + SvelteKit 5 + Prisma ORM Starter Kit</span>
        </div>

        <!-- Animated Heading with Gradient Shimmer -->
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
          Bangun Aplikasi Fullstack <br class="hidden sm:inline" />
          <span class="bg-gradient-to-r from-indigo-400 via-purple-400 via-pink-400 to-cyan-400 animate-shimmer bg-clip-text text-transparent">
            10x Lebih Cepat & Sangat Keren
          </span>
        </h1>

        <!-- Subtitle -->
        <p class="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
          Ekosistem starter kit terlengkap untuk SaaS & Enterprise. Dilengkapi **Auth JWT**, **RBAC Matrix**, **Audit Logs**, **Notification Center**, **Command Palette (Ctrl + K)**, dan UI **Shadcn Svelte**.
        </p>

        <!-- CTA Buttons with Hover Micro-Animations -->
        <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
          <button
            on:click={navigateToApp}
            class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-2xl shadow-indigo-500/40 hover:scale-105 hover:shadow-indigo-500/60 transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <span>Coba Starter Kit Sekarang</span>
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="http://localhost:3001/documentation"
            target="_blank"
            class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-card/80 border border-border hover:bg-muted font-bold text-sm text-foreground transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 shadow-md"
          >
            <Code2 class="w-5 h-5 text-indigo-400" />
            <span>Dokumentasi API</span>
          </a>
        </div>

        <!-- Trust Badges -->
        <div class="pt-6 border-t border-border/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-medium">
          <div class="flex items-center gap-2 hover:text-foreground transition-colors">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>100% Type-Safe TypeScript</span>
          </div>
          <div class="flex items-center gap-2 hover:text-foreground transition-colors">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>Modular Architecture</span>
          </div>
          <div class="flex items-center gap-2 hover:text-foreground transition-colors">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>Production Ready</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Animated Hero Girl Avatar Card -->
      <div class="lg:col-span-5 relative flex justify-center transition-all duration-1000 delay-200 {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}">
        <!-- Ambient Radial Glow Behind Card -->
        <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500/40 via-purple-500/30 to-pink-500/40 rounded-3xl blur-3xl transform rotate-3 animate-pulse-glow"></div>

        <!-- Main Floating Glassmorphic Container -->
        <div class="relative w-full max-w-md bg-card/80 backdrop-blur-2xl border border-border/90 rounded-3xl p-4 shadow-2xl space-y-4 animate-float">
          <!-- Floating Status Badge Left Top -->
          <div class="absolute -top-4 -left-4 z-20 px-3.5 py-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-indigo-500/40 shadow-xl flex items-center gap-2 text-xs font-bold text-foreground animate-bounce" style="animation-duration: 3s;">
            <Activity class="w-4 h-4 text-indigo-400 animate-spin" style="animation-duration: 6s;" />
            <span>Fastify 0.4ms Latency</span>
          </div>

          <!-- Floating Status Badge Right Bottom -->
          <div class="absolute -bottom-4 -right-4 z-20 px-3.5 py-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-pink-500/40 shadow-xl flex items-center gap-2 text-xs font-bold text-foreground">
            <Lock class="w-4 h-4 text-pink-400" />
            <span>JWT & RBAC Active</span>
          </div>

          <!-- Hero Girl Image Frame -->
          <div class="relative rounded-2xl overflow-hidden aspect-[4/5] border border-border/60 group">
            <img
              src="/hero_woman_avatar.png"
              alt="Tech Lead Developer"
              class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
            />
            <!-- Gradient Vignette Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>

            <!-- Glowing Header Overlay Badge -->
            <div class="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SvelteKit 5 Runes</span>
            </div>

            <!-- Bottom Floating Testimonial Overlay -->
            <div class="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 space-y-1.5">
              <div class="flex items-center justify-between">
                <p class="font-extrabold text-sm text-white">Sarah Jenkins</p>
                <div class="flex items-center gap-1 text-amber-400 text-xs">
                  <Star class="w-3.5 h-3.5 fill-current" />
                  <span class="font-bold">5.0</span>
                </div>
              </div>
              <p class="text-[11px] text-slate-300">Lead Architect @ FairuzKit Enterprise</p>
              <p class="text-[11px] text-indigo-300 italic pt-1">
                "Starter Kit ini memangkas waktu development kami dari 2 bulan menjadi hanya 3 hari!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Tech Stack Pills Section -->
  <section id="tech" class="py-12 border-y border-border/50 bg-muted/30 backdrop-blur-xl relative z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ditenagai Teknologi Modern Terbaik</p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        {#each techStack as tech}
          <div class="px-4 py-2 rounded-xl bg-card border border-border/80 shadow-sm flex items-center gap-2 hover:border-primary/50 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">
            <Cpu class="w-4 h-4 text-primary" />
            <span class="font-bold text-xs">{tech.name}</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{tech.tag}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Feature Grid Section -->
  <section id="fitur" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
    <div class="text-center space-y-4 max-w-2xl mx-auto">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold backdrop-blur-md">
        ✨ Fitur Bawaan Terlengkap
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Semua yang Anda Butuhkan Sudah Siap Pakai</h2>
      <p class="text-xs sm:text-sm text-muted-foreground">Tidak perlu lagi membuang waktu berminggu-minggu membuat fitur otentikasi, role permission, atau komponen UI dari nol.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each features as f}
        <div class="p-6 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/70 shadow-sm hover:shadow-2xl hover:border-primary/50 hover:-translate-y-2 transition-all duration-300 group space-y-4 relative overflow-hidden">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr {f.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svelte:component this={f.icon} class="w-6 h-6" />
          </div>
          <div class="space-y-2">
            <h3 class="font-bold text-base text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Interactive Terminal Showcase Section -->
  <section id="arsitektur" class="py-20 bg-muted/40 backdrop-blur-xl border-y border-border/50 relative z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-5 space-y-6">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur-md">
          💻 Clean Code Architecture
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight">Pattern Generator CRUD Modular</h2>
        <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Struktur kode backend dan frontend yang rapi dan terisolasi. Menambahkan fitur atau tabel baru hanya membutuhkan 4 langkah sederhana yang terdokumentasi lengkap.
        </p>

        <div class="space-y-3 pt-2 text-xs">
          <div class="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-md border border-border hover:border-primary/50 transition-colors">
            <div class="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">1</div>
            <span>Definisikan Model di Prisma Schema</span>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-md border border-border hover:border-primary/50 transition-colors">
            <div class="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">2</div>
            <span>Daftarkan Fastify Module & Route Guard RBAC</span>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-md border border-border hover:border-primary/50 transition-colors">
            <div class="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center text-xs">3</div>
            <span>Tambahkan Halaman SvelteKit 5 dengan Runes</span>
          </div>
        </div>
      </div>

      <!-- Terminal Preview Box -->
      <div class="lg:col-span-7">
        <div class="rounded-2xl border border-border bg-slate-950/90 backdrop-blur-2xl text-slate-100 font-mono shadow-2xl overflow-hidden text-xs">
          <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-rose-500"></div>
              <div class="w-3 h-3 rounded-full bg-amber-500"></div>
              <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span class="text-[11px] text-slate-400 ml-2">apps/api/src/modules/users/users.routes.ts</span>
            </div>
            <Terminal class="w-4 h-4 text-slate-400" />
          </div>
          <div class="p-6 space-y-2 overflow-x-auto text-slate-300">
            <p><span class="text-purple-400">export async function</span> <span class="text-blue-400">usersRoutes</span>(fastify: FastifyInstance) &#123;</p>
            <p class="pl-4"><span class="text-purple-400">fastify</span>.addHook(<span class="text-emerald-300">'preHandler'</span>, authenticate);</p>
            <p class="pl-4 text-slate-500">// List users with RBAC permission guard & pagination</p>
            <p class="pl-4"><span class="text-purple-400">fastify</span>.get(<span class="text-emerald-300">'/'</span>, &#123; preHandler: [hasPermission(<span class="text-emerald-300">'users:read'</span>)] &#125;, <span class="text-purple-400">async</span> (req, reply) =&gt; &#123;</p>
            <p class="pl-8"><span class="text-purple-400">const</span> [data, total] = <span class="text-purple-400">await</span> Promise.all([</p>
            <p class="pl-12">prisma.user.findMany(&#123; take: <span class="text-amber-400">10</span> &#125;),</p>
            <p class="pl-12">prisma.user.count()</p>
            <p class="pl-8">]);</p>
            <p class="pl-8"><span class="text-purple-400">return</span> reply.send(&#123; data, total &#125;);</p>
            <p class="pl-4">&#125;);</p>
            <p>&#125;</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Banner Section -->
  <section class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-2xl border border-indigo-500/30 shadow-2xl text-center space-y-6 relative overflow-hidden">
      <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl pointer-events-none animate-orb-1"></div>

      <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">Siap Membangun Project Masa Depan Anda?</h2>
      <p class="text-xs sm:text-sm text-indigo-200 max-w-xl mx-auto">Masuk ke admin dashboard sekarang untuk menjelajahi seluruh fitur manajemen pengguna, peran, audit log, dan notifikasi.</p>

      <div class="pt-4 flex justify-center">
        <button
          on:click={navigateToApp}
          class="px-8 py-4 rounded-2xl bg-white text-indigo-950 font-extrabold text-sm shadow-2xl hover:bg-slate-100 hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <span>Masuk ke Dashboard Sekarang</span>
          <ArrowRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-border py-12 bg-card/80 backdrop-blur-xl relative z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">SK</div>
        <span>© 2026 FairuzKit Modern. Built with SvelteKit 5 & Fastify.</span>
      </div>

      <div class="flex items-center gap-6">
        <a href="#fitur" class="hover:text-foreground">Fitur</a>
        <a href="#tech" class="hover:text-foreground">Teknologi</a>
        <a href="http://localhost:3001/documentation" target="_blank" class="hover:text-foreground">Swagger API</a>
      </div>
    </div>
  </footer>
</div>
