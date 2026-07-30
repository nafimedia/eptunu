<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$stores/auth';
  import { Users, ShieldCheck, Activity, Bell, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-svelte';
  import ApexChart from '$components/ApexChart.svelte';
  import { apiFetch } from '$api/client';
  import type { AuditLog } from '$types';

  let userCount = 2;
  let roleCount = 3;
  let recentAudits: AuditLog[] = [];
  let isLoading = true;

  const chartOptions = {
    chart: {
      type: 'area',
      height: 300,
      toolbar: { show: false },
      background: 'transparent',
    },
    theme: { mode: 'dark' },
    colors: ['#6366f1', '#ec4899'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      labels: { style: { colors: '#94a3b8' } }
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8' } }
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    series: [
      { name: 'Pengguna Aktif', data: [31, 40, 28, 51, 42, 109, 100] },
      { name: 'Aktivitas API', data: [11, 32, 45, 32, 34, 52, 41] },
    ],
  };

  async function loadDashboardData() {
    try {
      const resAudit = await apiFetch('/audit-logs?limit=5');
      recentAudits = resAudit.data || [];
    } catch (e) {
      // fallback
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadDashboardData();
  });
</script>

<div class="space-y-8 animate-in fade-in duration-200">
  <!-- Welcome Banner -->
  <div class="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-500/20 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div class="space-y-1 relative z-10">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
        <Sparkles class="w-3.5 h-3.5" /> StarterKit Modern v1.0.0
      </div>
      <h1 class="text-2xl lg:text-3xl font-bold tracking-tight">Selamat Datang, {$auth.user?.name || 'Pengguna'}! 👋</h1>
      <p class="text-xs lg:text-sm text-muted-foreground">Sistem Manajemen Fastify + SvelteKit 5 + Prisma ORM + MySQL siap digunakan.</p>
    </div>
    <a href="/dashboard/users" class="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-lg shadow-primary/30 transition-all flex items-center gap-1.5 shrink-0">
      <span>Kelola Pengguna</span>
      <ArrowUpRight class="w-4 h-4" />
    </a>
  </div>

  <!-- Key Metrics Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground">Total Pengguna</p>
        <h3 class="text-2xl font-bold">{userCount}</h3>
        <p class="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
          <TrendingUp class="w-3 h-3" /> +100% dari bulan lalu
        </p>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
        <Users class="w-6 h-6" />
      </div>
    </div>

    <div class="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground">Role Terdaftar</p>
        <h3 class="text-2xl font-bold">{roleCount}</h3>
        <p class="text-[11px] text-muted-foreground">SUPER_ADMIN, ADMIN, USER</p>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
        <ShieldCheck class="w-6 h-6" />
      </div>
    </div>

    <div class="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground">Aktivitas Sistem</p>
        <h3 class="text-2xl font-bold">99.9%</h3>
        <p class="text-[11px] text-emerald-400 font-medium">Fastify Server Active</p>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
        <Activity class="w-6 h-6" />
      </div>
    </div>

    <div class="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground">Queue BullMQ</p>
        <h3 class="text-2xl font-bold">Redis OK</h3>
        <p class="text-[11px] text-muted-foreground">Email Worker Running</p>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
        <Bell class="w-6 h-6" />
      </div>
    </div>
  </div>

  <!-- Analytics Chart & Recent Activity Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- ApexChart Analytics Widget -->
    <div class="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-bold text-base">Tren Performa & Pertumbuhan</h2>
          <p class="text-xs text-muted-foreground">Statistik permintaan API & aktivitas pengguna harian</p>
        </div>
      </div>
      <ApexChart options={chartOptions} />
    </div>

    <!-- Recent Audit Logs Feed -->
    <div class="p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4 flex flex-col">
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-base">Aktivitas Terbaru</h2>
        <a href="/dashboard/audit-logs" class="text-xs text-primary font-medium hover:underline">Lihat Semua</a>
      </div>

      <div class="space-y-3 flex-1 overflow-y-auto max-h-[320px]">
        {#if recentAudits.length === 0}
          <p class="text-xs text-muted-foreground text-center py-8">Belum ada riwayat aktivitas.</p>
        {:else}
          {#each recentAudits as item}
            <div class="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-primary">{item.action}</span>
                <span class="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p class="text-muted-foreground">{item.user?.name || 'System'} ({item.entity})</p>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div>
