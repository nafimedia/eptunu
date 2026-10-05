<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import {
    Download,
    Users,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Calendar,
    Building2,
    RefreshCw
  } from 'lucide-svelte';

  let analyticsData: any = null;
  let isLoading = true;

  // Filters
  let selectedFaculty = '';
  let selectedProdi = '';
  let sessionTitleFilter = '';
  let startDate = '';
  let endDate = '';

  let faculties: any[] = [];
  let studyPrograms: any[] = [];

  onMount(async () => {
    await Promise.all([loadMasterData(), loadAnalytics()]);
  });

  async function loadMasterData() {
    try {
      const [facRes, prodiRes] = await Promise.all([
        apiFetch('/master-data/faculties'),
        apiFetch('/master-data/study-programs'),
      ]);
      faculties = facRes.data || [];
      studyPrograms = prodiRes.data || [];
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAnalytics() {
    isLoading = true;
    try {
      let params = new URLSearchParams();
      if (selectedFaculty) params.append('faculty', selectedFaculty);
      if (selectedProdi) params.append('prodi', selectedProdi);
      if (sessionTitleFilter) params.append('sessionTitle', sessionTitleFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await apiFetch(`/reports/analytics?${params.toString()}`);
      analyticsData = res.data || null;
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat statistik laporan');
    } finally {
      isLoading = false;
    }
  }

  async function handleExportCSV() {
    try {
      let params = new URLSearchParams();
      if (selectedFaculty) params.append('faculty', selectedFaculty);
      if (selectedProdi) params.append('prodi', selectedProdi);
      if (sessionTitleFilter) params.append('sessionTitle', sessionTitleFilter);

      const res = await apiFetch(`/reports/export?${params.toString()}`);
      const rows = res.data || [];

      if (rows.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      // Convert array of objects to CSV format
      const headers = Object.keys(rows[0]).join(',');
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers, ...rows.map((r: any) => Object.values(r).map((v) => `"${v}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laporan_EPTUNU_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Laporan CSV berhasil diunduh!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengekspor laporan');
    }
  }
</script>

<svelte:head>
  <title>Laporan & Rekapitulasi - EPTUNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs">
    <div>
      <h1 class="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Laporan & Rekapitulasi EPT</h1>
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        on:click={handleExportCSV}
        class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs px-4 py-2.5 transition inline-flex items-center gap-2"
      >
        <Download class="w-3.5 h-3.5" />
        <span>Ekspor CSV</span>
      </button>
      <button
        type="button"
        on:click={loadAnalytics}
        class="border border-border bg-card hover:bg-muted text-foreground p-2.5 rounded-xl transition inline-flex items-center justify-center"
      >
        <RefreshCw class="w-4 h-4" />
      </button>
    </div>
  </header>

  <!-- Filters Bar -->
  <div class="bg-card p-4 rounded-2xl border border-border shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center text-xs">
    <div>
      <label for="rep-fac" class="block text-muted-foreground text-[11px] mb-1">Fakultas</label>
      <select
        id="rep-fac"
        bind:value={selectedFaculty}
        on:change={loadAnalytics}
        class="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
      >
        <option value="">Semua Fakultas</option>
        {#each faculties as f}
          <option value={f.name}>{f.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="rep-prodi" class="block text-muted-foreground text-[11px] mb-1">Program Studi</label>
      <select
        id="rep-prodi"
        bind:value={selectedProdi}
        on:change={loadAnalytics}
        class="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
      >
        <option value="">Semua Prodi</option>
        {#each studyPrograms as p}
          <option value={p.name}>{p.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="rep-session" class="block text-muted-foreground text-[11px] mb-1">Periode Sesi</label>
      <input
        id="rep-session"
        type="text"
        placeholder="Nama Sesi..."
        bind:value={sessionTitleFilter}
        on:input={loadAnalytics}
        class="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
      />
    </div>

    <div>
      <label for="rep-start" class="block text-muted-foreground text-[11px] mb-1">Tanggal Mulai</label>
      <input
        id="rep-start"
        type="date"
        bind:value={startDate}
        on:change={loadAnalytics}
        class="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
      />
    </div>

    <div>
      <label for="rep-end" class="block text-muted-foreground text-[11px] mb-1">Tanggal Akhir</label>
      <input
        id="rep-end"
        type="date"
        bind:value={endDate}
        on:change={loadAnalytics}
        class="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
      />
    </div>
  </div>

  {#if isLoading}
    <div class="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground text-xs shadow-xs">
      <RefreshCw class="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
      Memproses laporan dan statistik...
    </div>
  {:else if analyticsData}
    {@const ov = analyticsData.overview}
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <span class="block text-[11px] text-muted-foreground font-medium">Total Peserta</span>
            <span class="text-xl font-black text-foreground">{ov.totalTakers}</span>
          </div>
        </div>
      </div>

      <div class="bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <span class="block text-[11px] text-muted-foreground font-medium">Peserta Lulus</span>
            <span class="text-xl font-black text-emerald-600 dark:text-emerald-400">{ov.passedCount} <span class="text-xs font-normal text-muted-foreground">({ov.passRate}%)</span></span>
          </div>
        </div>
      </div>

      <div class="bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-2xl">
            <XCircle class="w-5 h-5" />
          </div>
          <div>
            <span class="block text-[11px] text-muted-foreground font-medium">Tidak Lulus</span>
            <span class="text-xl font-black text-rose-600 dark:text-rose-400">{ov.failedCount}</span>
          </div>
        </div>
      </div>

      <div class="bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-2xl">
            <TrendingUp class="w-5 h-5" />
          </div>
          <div>
            <span class="block text-[11px] text-muted-foreground font-medium">Rata-rata Skor EPT</span>
            <span class="text-xl font-black text-amber-600 dark:text-amber-400">{ov.avgTotal}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Score Breakdown Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-card p-5 rounded-2xl border border-border text-center shadow-xs">
        <span class="text-[11px] text-muted-foreground uppercase font-semibold block mb-1">Rata-rata Listening</span>
        <span class="text-2xl font-black text-primary">{ov.avgListening}</span>
      </div>
      <div class="bg-card p-5 rounded-2xl border border-border text-center shadow-xs">
        <span class="text-[11px] text-muted-foreground uppercase font-semibold block mb-1">Rata-rata Structure</span>
        <span class="text-2xl font-black text-primary">{ov.avgStructure}</span>
      </div>
      <div class="bg-card p-5 rounded-2xl border border-border text-center shadow-xs">
        <span class="text-[11px] text-muted-foreground uppercase font-semibold block mb-1">Rata-rata Reading</span>
        <span class="text-2xl font-black text-primary">{ov.avgReading}</span>
      </div>
    </div>

    <!-- Breakdown by Faculty & Monthly Rekap -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Faculty Breakdown -->
      <div class="bg-card p-6 rounded-2xl border border-border shadow-xs">
        <h3 class="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Building2 class="w-4 h-4 text-primary" />
          Rekapitulasi per Fakultas
        </h3>

        <div class="space-y-4">
          {#each Object.entries(analyticsData.facultyBreakdown || {}) as [name, dataObj]}
            {@const data = dataObj as any}
            {@const rate = data.count > 0 ? Math.round((data.passed / data.count) * 100) : 0}
            <div class="space-y-1 text-xs">
              <div class="flex justify-between font-bold text-foreground">
                <span>{name}</span>
                <span>{data.passed}/{data.count} Lulus ({rate}%)</span>
              </div>
              <div class="w-full bg-muted/60 rounded-full h-2 overflow-hidden border border-border">
                <div class="bg-primary h-full rounded-full transition-all" style={`width: ${rate}%`}></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Monthly Summary -->
      <div class="bg-card p-6 rounded-2xl border border-border shadow-xs">
        <h3 class="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Calendar class="w-4 h-4 text-emerald-500" />
          Rekap Bulanan
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-foreground">
            <thead class="bg-muted/50 text-muted-foreground uppercase text-[10px] border-b border-border">
              <tr>
                <th class="p-2.5">Bulan</th>
                <th class="p-2.5 text-center">Total Peserta</th>
                <th class="p-2.5 text-center">Jumlah Lulus</th>
                <th class="p-2.5 text-center">Rata-rata Skor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each Object.entries(analyticsData.monthlySummary || {}) as [month, statsObj]}
                {@const stats = statsObj as any}
                <tr class="hover:bg-muted/30">
                  <td class="p-2.5 font-bold text-foreground font-mono">{month}</td>
                  <td class="p-2.5 text-center">{stats.total}</td>
                  <td class="p-2.5 text-center text-emerald-600 dark:text-emerald-400 font-bold">{stats.passed}</td>
                  <td class="p-2.5 text-center font-bold text-amber-600 dark:text-amber-400">{stats.avgScore}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>
