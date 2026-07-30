<script lang="ts">
  import { onMount } from 'svelte';
  import { auth, clearAuth } from '$stores/auth';
  import { goto } from '$app/navigation';
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import {
    KeyRound,
    PlayCircle,
    LogOut,
    Award,
    Users,
    Calendar,
    FileQuestion,
    BarChart3,
    ShieldCheck,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    Activity,
    Layers,
    Database,
    Play,
    Power
  } from 'lucide-svelte';

  let role = 'STUDENT';
  $: role = ($auth.user?.role || 'STUDENT').toUpperCase();

  // Student Dashboard State
  let tokenInput = '';
  let loading = false;
  let error = '';
  let examHistory: any[] = [];

  // Admin / Proctor / Author / Executive Dashboard Stats State
  let adminStats = {
    usersCount: 0,
    activeSessionsCount: 0,
    questionsCount: 0,
    certificatesCount: 0,
    passRate: 0,
  };
  let recentSessions: any[] = [];
  let questionsStats = { total: 0, draft: 0, inReview: 0, approved: 0 };

  onMount(async () => {
    if (!$auth.isAuthenticated) {
      goto('/login');
      return;
    }
    if (role === 'STUDENT') {
      await fetchHistory();
    } else {
      await fetchRoleDashboardData();
    }
  });

  async function fetchHistory() {
    try {
      const res = await apiFetch('/exam/my-exams');
      if (res.success) {
        examHistory = res.data || [];
      }
    } catch (e) {
      // ignore
    }
  }

  async function fetchRoleDashboardData() {
    try {
      if (['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE'].includes(role)) {
        const [usersRes, sessionsRes, reportsRes] = await Promise.allSettled([
          apiFetch('/users?limit=1'),
          apiFetch('/exam-sessions'),
          apiFetch('/reports/analytics'),
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value.success) {
          adminStats.usersCount = usersRes.value.pagination?.total || 0;
        }

        if (sessionsRes.status === 'fulfilled' && sessionsRes.value.success) {
          const sessions = sessionsRes.value.data || [];
          recentSessions = sessions.slice(0, 5);
          adminStats.activeSessionsCount = sessions.filter((s: any) => s.isActive).length;
        }

        if (reportsRes.status === 'fulfilled' && reportsRes.value.success) {
          const analytics = reportsRes.value.data?.overview;
          if (analytics) {
            adminStats.passRate = analytics.passRate || 0;
          }
        }
      }

      if (['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'QUESTION_AUTHOR', 'VALIDATOR'].includes(role)) {
        const questionsRes = await apiFetch('/questions');
        if (questionsRes.success) {
          const qList = questionsRes.data || [];
          adminStats.questionsCount = qList.length;
          questionsStats.total = qList.length;
          questionsStats.draft = qList.filter((q: any) => q.status === 'DRAFT').length;
          questionsStats.inReview = qList.filter((q: any) => q.status === 'IN_REVIEW').length;
          questionsStats.approved = qList.filter((q: any) => q.status === 'APPROVED').length;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  async function handleStartSession(session: any) {
    if (!confirm(`Mulai sesi ujian '${session.title}' sekarang secara manual? Token baru akan di-generate.`)) return;

    try {
      const res = await apiFetch(`/exam-sessions/${session.id}/start-session`, { method: 'PUT' });
      toast.success(res.message || `Sesi '${session.title}' berhasil dimulai!`);
      await fetchRoleDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memulai sesi ujian');
    }
  }

  async function handleStopSession(session: any) {
    if (!confirm(`Hentikan sesi ujian '${session.title}' secara manual?`)) return;

    try {
      const res = await apiFetch(`/exam-sessions/${session.id}/stop-session`, { method: 'PUT' });
      toast.success(res.message || `Sesi '${session.title}' berhasil dihentikan`);
      await fetchRoleDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghentikan sesi ujian');
    }
  }

  async function handleStartExam() {
    if (!tokenInput.trim()) {
      error = 'Masukkan token ujian terlebih dahulu.';
      return;
    }

    error = '';
    loading = true;

    try {
      const userToken = localStorage.getItem('token');
      const res = await fetch('/api/v1/exam/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memulai ujian. Periksa token Anda.');
      }

      sessionStorage.setItem('currentExamSession', JSON.stringify(data.data));
      goto(`/exam/${data.data.studentExamId}`);
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleLogout() {
    clearAuth();
    goto('/login');
  }
</script>

<div class="space-y-6">
  <!-- Shared Header -->
  <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-xs">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Dashboard {role === 'STUDENT' ? 'Peserta Ujian' : (role === 'PROCTOR' ? 'Pengawas Ujian' : (role === 'EXECUTIVE' ? 'Pimpinan / Eksekutif' : (role === 'QUESTION_AUTHOR' || role === 'VALIDATOR' ? 'Tim Bank Soal' : 'Administrator')))}
        </h1>
        <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border bg-primary/10 text-primary border-primary/20">
          {role}
        </span>
      </div>
      <p class="text-xs text-muted-foreground">
        Selamat Datang, <strong class="text-foreground">{$auth.user?.fullName || 'Pengguna'}</strong>
        ({$auth.user?.identityNumber || '-'}) • {$auth.user?.prodi || 'UNU Purwokerto'}
      </p>
    </div>

    <button
      on:click={handleLogout}
      class="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl text-xs font-semibold border border-border transition self-start sm:self-auto"
    >
      <LogOut class="w-4 h-4" />
      <span>Keluar</span>
    </button>
  </header>

  <!-- ROLE 1: STUDENT DASHBOARD -->
  {#if role === 'STUDENT'}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Exam Token Entry Card -->
      <div class="lg:col-span-1 bg-card border border-border p-6 rounded-2xl shadow-xs h-fit space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <KeyRound class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-bold text-foreground text-base">Masuk Ruang Ujian</h2>
            <p class="text-xs text-muted-foreground">Gunakan token dari pengawas</p>
          </div>
        </div>

        {#if error}
          <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        {/if}

        <form on:submit|preventDefault={handleStartExam} class="space-y-4">
          <div>
            <label for="token" class="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Token Ujian (6 Karakter)
            </label>
            <input
              id="token"
              type="text"
              bind:value={tokenInput}
              placeholder="Contoh: EPT2026"
              class="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground font-mono text-center tracking-widest text-lg uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-bold rounded-xl text-sm transition shadow-md shadow-primary/20 flex items-center justify-center gap-2"
          >
            {#if loading}
              <span>Verifikasi Token...</span>
            {:else}
              <PlayCircle class="w-5 h-5" />
              <span>Mulai Ujian EPT</span>
            {/if}
          </button>
        </form>

        <div class="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs text-muted-foreground leading-relaxed">
          💡 Token simulasi aktif default: <strong class="text-primary font-mono">EPT2026</strong>
        </div>
      </div>

      <!-- History & Score Results Table -->
      <div class="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-xs">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <Award class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-bold text-foreground text-base">Riwayat & Hasil Ujian EPT</h2>
            <p class="text-xs text-muted-foreground">Daftar ujian yang pernah diikuti beserta skor TOEFL ITP</p>
          </div>
        </div>

        {#if examHistory.length === 0}
          <div class="p-8 text-center bg-muted/20 rounded-xl border border-border text-muted-foreground text-sm">
            Belum ada riwayat ujian. Masukkan token di samping untuk memulai ujian pertama Anda.
          </div>
        {:else}
          <div class="space-y-4">
            {#each examHistory as exam}
              <div class="p-4 bg-muted/30 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-foreground text-sm">{exam.examSession?.title || 'EPT Session'}</h3>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold border {exam.status === 'SUBMITTED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}">
                      {exam.status}
                    </span>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    Token: <span class="font-mono text-foreground">{exam.examSession?.token}</span> •
                    Tgl: {new Date(exam.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>

                {#if exam.status === 'SUBMITTED' || exam.status === 'FORCE_SUBMITTED'}
                  <div class="flex items-center gap-4 bg-card px-4 py-2.5 rounded-xl border border-border shadow-2xs">
                    <div class="text-center">
                      <span class="block text-[10px] text-muted-foreground uppercase font-semibold">Listening</span>
                      <span class="text-sm font-bold text-primary">{exam.scoreListening || 31}</span>
                    </div>
                    <div class="text-center">
                      <span class="block text-[10px] text-muted-foreground uppercase font-semibold">Structure</span>
                      <span class="text-sm font-bold text-primary">{exam.scoreStructure || 31}</span>
                    </div>
                    <div class="text-center">
                      <span class="block text-[10px] text-muted-foreground uppercase font-semibold">Reading</span>
                      <span class="text-sm font-bold text-primary">{exam.scoreReading || 31}</span>
                    </div>
                    <div class="pl-2 border-l border-border text-center">
                      <span class="block text-[10px] text-amber-500 font-semibold uppercase">Total Skor</span>
                      <span class="text-base font-extrabold text-amber-600">{exam.totalScore || 310}</span>
                    </div>
                  </div>
                {:else}
                  <a
                    href="/exam/{exam.id}"
                    class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs transition text-center"
                  >
                    Lanjutkan Ujian
                  </a>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

  <!-- ROLE 2: SUPER_ADMIN / ADMIN_EPT DASHBOARD -->
  {:else if role === 'SUPER_ADMIN' || role === 'ADMIN_EPT' || role === 'ADMIN'}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-muted-foreground">Total Pengguna</p>
          <h3 class="text-2xl font-extrabold text-foreground mt-1">{adminStats.usersCount}</h3>
        </div>
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <Users class="w-6 h-6" />
        </div>
      </div>

      <div class="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-muted-foreground">Sesi Ujian Aktif</p>
          <h3 class="text-2xl font-extrabold text-foreground mt-1">{adminStats.activeSessionsCount}</h3>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <Calendar class="w-6 h-6" />
        </div>
      </div>

      <div class="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-muted-foreground">Bank Soal EPT</p>
          <h3 class="text-2xl font-extrabold text-foreground mt-1">{adminStats.questionsCount}</h3>
        </div>
        <div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
          <FileQuestion class="w-6 h-6" />
        </div>
      </div>

      <div class="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-muted-foreground">Tingkat Kelulusan</p>
          <h3 class="text-2xl font-extrabold text-foreground mt-1">{adminStats.passRate}%</h3>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <BarChart3 class="w-6 h-6" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Quick Navigation Actions -->
      <div class="lg:col-span-1 bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
        <h2 class="font-bold text-foreground text-base">Akses Cepat Pengelolaan</h2>
        <div class="space-y-2">
          <a href="/dashboard/schedule" class="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition text-xs font-semibold text-foreground group">
            <span class="flex items-center gap-3">
              <Calendar class="w-4 h-4 text-primary" /> Kelola Jadwal Ujian
            </span>
            <ArrowUpRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
          </a>
          <a href="/dashboard/questions" class="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition text-xs font-semibold text-foreground group">
            <span class="flex items-center gap-3">
              <FileQuestion class="w-4 h-4 text-purple-500" /> Bank Soal EPT
            </span>
            <ArrowUpRight class="w-4 h-4 text-muted-foreground group-hover:text-purple-500 transition" />
          </a>
          <a href="/dashboard/users" class="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition text-xs font-semibold text-foreground group">
            <span class="flex items-center gap-3">
              <Users class="w-4 h-4 text-blue-500" /> Manajemen Pengguna
            </span>
            <ArrowUpRight class="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition" />
          </a>
          <a href="/dashboard/roles" class="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition text-xs font-semibold text-foreground group">
            <span class="flex items-center gap-3">
              <ShieldCheck class="w-4 h-4 text-emerald-500" /> Role & Hak Akses
            </span>
            <ArrowUpRight class="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition" />
          </a>
          <a href="/dashboard/settings" class="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition text-xs font-semibold text-foreground group">
            <span class="flex items-center gap-3">
              <Database class="w-4 h-4 text-amber-500" /> Pengaturan Sistem
            </span>
            <ArrowUpRight class="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition" />
          </a>
        </div>
      </div>

      <!-- Recent Sessions -->
      <div class="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-xs">
        <h2 class="font-bold text-foreground text-base mb-4">Sesi Ujian Terkini</h2>
        {#if recentSessions.length === 0}
          <div class="p-8 text-center bg-muted/20 rounded-xl text-muted-foreground text-sm">
            Belum ada data sesi ujian.
          </div>
        {:else}
          <div class="space-y-3">
            {#each recentSessions as s}
              <div class="p-3.5 bg-muted/30 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-foreground text-xs">{s.title}</h3>
                  <p class="text-[11px] text-muted-foreground mt-0.5">
                    Token: <span class="font-mono text-primary font-bold">{s.token}</span> • {new Date(s.startTime).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold border {s.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}">
                  {s.isActive ? 'AKTIF' : 'NON-AKTIF'}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

  <!-- ROLE 3: PROCTOR DASHBOARD -->
  {:else if role === 'PROCTOR'}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <Activity class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-bold text-foreground text-base">Monitoring Sesi Ujian Real-Time</h2>
            <p class="text-xs text-muted-foreground">Pantau pelaksanaan sesi ujian yang sedang berjalan</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div class="p-4 rounded-xl bg-muted/30 border border-border">
            <p class="text-xs font-semibold text-muted-foreground">Sesi Aktif Saat Ini</p>
            <h3 class="text-2xl font-extrabold text-foreground mt-1">{adminStats.activeSessionsCount} Sesi</h3>
          </div>
          <div class="p-4 rounded-xl bg-muted/30 border border-border">
            <p class="text-xs font-semibold text-muted-foreground">Pengawasan Ujian</p>
            <a href="/dashboard/schedule" class="inline-flex items-center gap-1.5 text-xs font-bold text-primary mt-2 hover:underline">
              Buka Ruang Pengawas Ujian <ArrowUpRight class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div class="pt-4 border-t border-border">
          <h3 class="font-bold text-foreground text-xs mb-3">Daftar Sesi Ujian Hari Ini</h3>
          {#each recentSessions as s}
            <div class="p-3 bg-muted/20 rounded-xl border border-border flex items-center justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-foreground text-xs">{s.title}</span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {s.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}">
                    {s.isActive ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
                <p class="text-[11px] text-muted-foreground">Token: <strong class="font-mono text-primary">{s.token}</strong></p>
              </div>

              <div class="flex items-center gap-2">
                {#if s.isActive}
                  <button
                    on:click={() => handleStopSession(s)}
                    class="px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                  >
                    <Power class="w-3.5 h-3.5" /> Stop
                  </button>
                {:else}
                  <button
                    on:click={() => handleStartSession(s)}
                    class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
                  >
                    <Play class="w-3.5 h-3.5 fill-current" /> Mulai Ujian
                  </button>
                {/if}
                <a href="/dashboard/schedule" class="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition">
                  Pengawasan
                </a>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="lg:col-span-1 bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
        <h2 class="font-bold text-foreground text-base">Panduan Pengawas</h2>
        <div class="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <div class="p-3 bg-muted/40 rounded-xl border border-border">
            1. Rilis token ujian hanya kepada peserta yang sudah terverifikasi hadir di ruangan.
          </div>
          <div class="p-3 bg-muted/40 rounded-xl border border-border">
            2. Pantau indikator sesi peserta. Jika terjadi gangguan teknis/mati listrik, gunakan tombol Reset Sesi.
          </div>
          <div class="p-3 bg-muted/40 rounded-xl border border-border">
            3. Pastikan seluruh peserta menekan "Selesai Ujian" sebelum mengakhiri durasi pengawasan.
          </div>
        </div>
      </div>
    </div>

  <!-- ROLE 4: QUESTION_AUTHOR / VALIDATOR DASHBOARD -->
  {:else if role === 'QUESTION_AUTHOR' || role === 'VALIDATOR'}
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl bg-card border border-border shadow-xs">
        <p class="text-xs font-medium text-muted-foreground">Total Bank Soal</p>
        <h3 class="text-2xl font-extrabold text-foreground mt-1">{questionsStats.total}</h3>
      </div>
      <div class="p-5 rounded-2xl bg-card border border-border shadow-xs">
        <p class="text-xs font-medium text-muted-foreground">Status Draft</p>
        <h3 class="text-2xl font-extrabold text-amber-500 mt-1">{questionsStats.draft}</h3>
      </div>
      <div class="p-5 rounded-2xl bg-card border border-border shadow-xs">
        <p class="text-xs font-medium text-muted-foreground">Dalam Review</p>
        <h3 class="text-2xl font-extrabold text-blue-500 mt-1">{questionsStats.inReview}</h3>
      </div>
      <div class="p-5 rounded-2xl bg-card border border-border shadow-xs">
        <p class="text-xs font-medium text-muted-foreground">Disetujui (Approved)</p>
        <h3 class="text-2xl font-extrabold text-emerald-500 mt-1">{questionsStats.approved}</h3>
      </div>
    </div>

    <div class="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-bold text-foreground text-base">Repositori & Kelola Bank Soal</h2>
          <p class="text-xs text-muted-foreground">Kelola paket soal Listening, Structure, & Reading TOEFL ITP</p>
        </div>
        <a href="/dashboard/questions" class="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs transition flex items-center gap-2">
          <FileQuestion class="w-4 h-4" /> Buka Bank Soal
        </a>
      </div>
    </div>

  <!-- ROLE 5: EXECUTIVE DASHBOARD -->
  {:else if role === 'EXECUTIVE'}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-2">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tingkat Kelulusan Global</p>
        <h3 class="text-3xl font-extrabold text-emerald-500">{adminStats.passRate}%</h3>
        <p class="text-xs text-muted-foreground">Persentase kelulusan terhadap standar passing score (450)</p>
      </div>

      <div class="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-2">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Peserta Terdaftar</p>
        <h3 class="text-3xl font-extrabold text-foreground">{adminStats.usersCount}</h3>
        <p class="text-xs text-muted-foreground">Akun mahasiswa & peserta EPT terdaftar dalam sistem</p>
      </div>

      <div class="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-2">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Laporan Analitik</p>
        <a href="/dashboard/reports" class="inline-flex items-center gap-2 text-sm font-bold text-primary mt-2 hover:underline">
          <BarChart3 class="w-4 h-4" /> Lihat Rekap Per Fakultas <ArrowUpRight class="w-4 h-4" />
        </a>
      </div>
    </div>
  {/if}
</div>
