<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Key,
    UserCheck,
    Plus,
    RefreshCw,
    Trash2,
    Edit2,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    X,
    Sparkles,
    Shield,
    Play,
    Square,
    Power,
    Bell,
    Send,
    ArrowRight,
    ExternalLink,
    Award
  } from 'lucide-svelte';
  import { auth } from '$stores/auth';
  import { goto } from '$app/navigation';

  let isLoading = true;
  let sessions: any[] = [];
  let studentExams: any[] = [];
  let proctors: any[] = [];

  $: currentUser = $auth.user;
  $: isStudent = currentUser?.role === 'STUDENT';
  $: isAdmin = currentUser?.role && ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR'].includes(currentUser.role);

  // Copy state
  let copiedTokenId: string | null = null;

  function copyToken(text: string, id: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    copiedTokenId = id;
    toast.success('Token Ujian berhasil disalin!');
    setTimeout(() => {
      copiedTokenId = null;
    }, 2000);
  }

  // Modal state
  let isModalOpen = false;
  let modalTitle = 'Tambah Jadwal Ujian Baru';
  let isEditMode = false;

  let formData = {
    id: '',
    title: '',
    token: '',
    startTime: '',
    endTime: '',
    durationMin: 110,
    room: 'Lab Komputer 1 (Gedung Rektorat Lt. 2)',
    quota: 35,
    proctorId: '',
    isActive: true,
  };

  async function loadSchedules() {
    isLoading = true;
    try {
      const res = await apiFetch('/exam-sessions');
      sessions = res.data || [];
      studentExams = res.studentExams || [];
      proctors = res.proctors || [];
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat jadwal ujian');
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    isEditMode = false;
    modalTitle = 'Tambah Jadwal Ujian Baru';

    const now = new Date();
    const startTimeStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const endTimeStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    formData = {
      id: '',
      title: 'EPT Regular Periode Sesi Pagi',
      token: generateRandomToken(),
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMin: 110,
      room: 'Lab Komputer 1 (Gedung Rektorat Lt. 2)',
      quota: 35,
      proctorId: proctors[0]?.id || '',
      isActive: true,
    };
    isModalOpen = true;
  }

  function openEditModal(session: any) {
    isEditMode = true;
    modalTitle = 'Edit Jadwal Ujian';

    const startTimeStr = new Date(new Date(session.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const endTimeStr = new Date(new Date(session.endTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    formData = {
      id: session.id,
      title: session.title,
      token: session.token,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMin: session.durationMin || 110,
      room: session.room || 'Lab Komputer 1',
      quota: session.quota || 35,
      proctorId: session.proctorId || '',
      isActive: session.isActive,
    };
    isModalOpen = true;
  }

  function generateRandomToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function handleSaveSchedule() {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Judul, Waktu Mulai, dan Waktu Selesai wajib diisi');
      return;
    }

    try {
      let res;
      if (isEditMode) {
        res = await apiFetch(`/exam-sessions/${formData.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success(res.message || 'Jadwal ujian berhasil diperbarui');
      } else {
        res = await apiFetch('/exam-sessions', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success(res.message || 'Jadwal ujian baru berhasil dibuat');
      }

      isModalOpen = false;
      await loadSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan jadwal ujian');
    }
  }

  async function handleRegenerateToken(session: any) {
    try {
      const res = await apiFetch(`/exam-sessions/${session.id}/generate-token`, { method: 'PUT' });
      toast.success(res.message || 'Token ujian baru berhasil dibuat!');
      await loadSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui token');
    }
  }

  async function handleStartSession(session: any) {
    if (!confirm(`Mulai sesi ujian '${session.title}' sekarang secara manual? Token baru akan di-generate dan durasi hitung mundur ujian akan berjalan.`)) return;

    try {
      const res = await apiFetch(`/exam-sessions/${session.id}/start-session`, { method: 'PUT' });
      toast.success(res.message || `Sesi '${session.title}' berhasil dimulai!`);
      await loadSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memulai sesi ujian');
    }
  }

  async function handleStopSession(session: any) {
    if (!confirm(`Hentikan sesi ujian '${session.title}' secara manual? Peserta tidak akan bisa lagi masuk menggunakan token ini.`)) return;

    try {
      const res = await apiFetch(`/exam-sessions/${session.id}/stop-session`, { method: 'PUT' });
      toast.success(res.message || `Sesi '${session.title}' berhasil dihentikan`);
      await loadSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghentikan sesi ujian');
    }
  }

  let sendingReminderId: string | null = null;

  async function handleSendReminder(session: any) {
    if (!confirm(`Kirim notifikasi pengingat H-1 & Kartu Ujian via Email & WA ke seluruh peserta sesi '${session.title}'?`)) return;

    sendingReminderId = session.id;
    try {
      const res = await apiFetch('/notifications/send-reminder', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.id, channel: 'BOTH' }),
      });
      toast.success(res.message || 'Notifikasi pengingat H-1 berhasil dikirim!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim notifikasi pengingat');
    } finally {
      sendingReminderId = null;
    }
  }

  async function handleDeleteSchedule(id: string, title: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus jadwal '${title}'?`)) return;

    try {
      await apiFetch(`/exam-sessions/${id}`, { method: 'DELETE' });
      toast.success('Jadwal ujian berhasil dihapus');
      await loadSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus jadwal');
    }
  }

  function copyToClipboard(token: string, id: string) {
    navigator.clipboard.writeText(token);
    copiedTokenId = id;
    toast.success(`Token ${token} berhasil disalin!`);
    setTimeout(() => { copiedTokenId = null; }, 2000);
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onMount(() => {
    loadSchedules();
  });
</script>

<svelte:head>
  <title>Jadwal Ujian EPT | EPT UNU Purwokerto</title>
</svelte:head>

{#if isStudent}
  <!-- STUDENT DASHBOARD VIEW FOR EXAM SCHEDULES -->
  <div class="space-y-6">
    <!-- Student Header Banner -->
    <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-emerald-800/40 shadow-2xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-2">
          <Calendar class="w-3.5 h-3.5" /> Pelaksanaan Ujian CBT Peserta
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight">Jadwal Ujian EPT UNU Purwokerto</h1>
        <p class="text-slate-300 text-xs mt-1">
          Pantau sesi terdaftar Anda, verifikasi status ruang Lab Komputer, token akses, dan pintu masuk ujian CBT.
        </p>
      </div>

      <button
        on:click={loadSchedules}
        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl border border-emerald-500/30 transition shadow"
      >
        <RefreshCw class="w-3.5 h-3.5" /> Refresh Jadwal
      </button>
    </div>

    <!-- Section 1: Registered Sessions -->
    <div class="space-y-4">
      <h2 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
        <UserCheck class="w-5 h-5 text-emerald-600" />
        <span>Sesi Ujian Terdaftar Saya</span>
      </h2>

      {#if isLoading}
        <div class="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
          Memuat sesi ujian terdaftar...
        </div>
      {:else if studentExams.length === 0}
        <div class="p-6 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-amber-900 space-y-3">
          <div class="flex items-center gap-2 font-bold text-sm">
            <Sparkles class="w-4 h-4 text-amber-600" />
            <span>Anda belum terdaftar pada sesi ujian aktif</span>
          </div>
          <p class="text-xs text-amber-800">
            Silakan mendaftar pada salah satu sesi ujian EPT yang tersedia di bawah ini untuk memperoleh jadwal dan token pelaksanaan ujian.
          </p>
          <a
            href="/dashboard/registrations"
            class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow"
          >
            <UserCheck class="w-3.5 h-3.5" />
            <span>Daftar Sesi Ujian Sekarang</span>
          </a>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each studentExams as exam}
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 space-y-4 relative overflow-hidden">
              <div class="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                    {exam.status === 'COMPLETED' ? 'SELESAI' : (exam.examSession?.isActive ? 'SESI AKTIF' : 'TERDAFTAR')}
                  </span>
                  <h3 class="text-base font-extrabold text-slate-900">{exam.examSession?.title || 'EPT Regular Sesi'}</h3>
                </div>
              </div>

              <!-- Session Info -->
              <div class="space-y-2 text-xs text-slate-600">
                <div class="flex items-center gap-2">
                  <Clock class="w-4 h-4 text-slate-400" />
                  <span>{new Date(exam.examSession?.startTime).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB</span>
                </div>
                <div class="flex items-center gap-2">
                  <MapPin class="w-4 h-4 text-indigo-500" />
                  <span class="font-semibold text-slate-800">{exam.examSession?.room || 'Lab Komputer 1 UNU Purwokerto'}</span>
                </div>
              </div>

              <!-- Token Box -->
              <div class="p-3 bg-slate-900 rounded-xl text-white flex items-center justify-between shadow-inner">
                <div class="flex items-center gap-3">
                  <Key class="w-4 h-4 text-indigo-400" />
                  <div>
                    <div class="text-[10px] text-slate-400 font-semibold uppercase">Token Ujian Anda</div>
                    <div class="font-mono text-base font-black text-indigo-300 tracking-widest">{exam.examSession?.token || '******'}</div>
                  </div>
                </div>
                <button
                  on:click={() => copyToken(exam.examSession?.token, exam.id)}
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition"
                >
                  {copiedTokenId === exam.id ? 'Tersalin!' : 'Salin Token'}
                </button>
              </div>

              <!-- CTA Launch Button -->
              {#if exam.status === 'COMPLETED' || exam.status === 'SUBMITTED' || exam.status === 'FORCE_SUBMITTED'}
                <button
                  on:click={() => goto('/dashboard/results')}
                  class="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Award class="w-4 h-4 text-amber-400" />
                  <span>Lihat Hasil Skor EPT</span>
                </button>
              {:else if exam.examSession?.isActive || exam.status === 'IN_PROGRESS'}
                <button
                  on:click={() => goto(`/exam/${exam.id}`)}
                  class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 animate-pulse"
                >
                  <Play class="w-4 h-4 fill-current" />
                  <span>MASUK RUANG UJIAN CBT SEKARANG</span>
                </button>
              {:else}
                <div class="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs text-center font-medium">
                  ⏳ Sesi Belum Dimulai (Hadir 15 menit sebelum jadwal di Lab Komputer)
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Section 2: Public Available Active Sessions -->
    <div class="space-y-4 pt-4 border-t border-slate-200">
      <h2 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
        <Calendar class="w-5 h-5 text-indigo-600" />
        <span>Sesi Ujian EPT Aktif Tersedia</span>
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each sessions as s}
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {s.isActive ? 'SESI AKTIF' : 'MENDATANG'}
              </span>
              <span class="text-xs font-bold text-slate-500">Kuota: {s._count?.studentExams || 0}/{s.quota}</span>
            </div>
            <h3 class="font-extrabold text-slate-900 text-sm">{s.title}</h3>
            <div class="text-xs text-slate-500 space-y-1">
              <div class="flex items-center gap-1.5"><Clock class="w-3.5 h-3.5" /> {new Date(s.startTime).toLocaleString('id-ID')}</div>
              <div class="flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5" /> {s.room || 'Lab Komputer UNU'}</div>
            </div>
            <a
              href="/dashboard/registrations"
              class="block text-center py-2 px-3 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-slate-200 transition"
            >
              📝 Daftar Sesi Ujian Ini
            </a>
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <!-- ADMIN / PROCTOR MANAGEMENT VIEW -->
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/50 shadow-xl text-white">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
          <Calendar class="w-3.5 h-3.5" /> Modul Pelaksanaan & Sesi Ujian
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight">Manajemen Jadwal Ujian EPT</h1>
        <p class="text-slate-300 text-sm mt-1">
          Kelola Tanggal, Jam, Ruang Lab, Kuota Peserta, Pengawas (Proctor), dan Token Paket Soal.
        </p>
      </div>

      <button
        on:click={openCreateModal}
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200"
      >
        <Plus class="w-4 h-4" /> Buat Jadwal Ujian Baru
      </button>
    </div>

  <!-- Stat Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
        <Calendar class="w-6 h-6" />
      </div>
      <div>
        <div class="text-xs font-medium text-slate-500">Total Jadwal Sesi</div>
        <div class="text-xl font-black text-slate-900 mt-0.5">{sessions.length} Sesi</div>
      </div>
    </div>

    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
        <CheckCircle2 class="w-6 h-6" />
      </div>
      <div>
        <div class="text-xs font-medium text-slate-500">Sesi Aktif</div>
        <div class="text-xl font-black text-emerald-700 mt-0.5">
          {sessions.filter(s => s.isActive).length} Sesi
        </div>
      </div>
    </div>

    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
        <Users class="w-6 h-6" />
      </div>
      <div>
        <div class="text-xs font-medium text-slate-500">Total Peserta Terdaftar</div>
        <div class="text-xl font-black text-blue-700 mt-0.5">
          {sessions.reduce((acc, s) => acc + (s._count?.studentExams || 0), 0)} Peserta
        </div>
      </div>
    </div>

    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
        <MapPin class="w-6 h-6" />
      </div>
      <div>
        <div class="text-xs font-medium text-slate-500">Total Kapasitas Kuota</div>
        <div class="text-xl font-black text-purple-700 mt-0.5">
          {sessions.reduce((acc, s) => acc + (s.quota || 35), 0)} Kursi
        </div>
      </div>
    </div>
  </div>

  <!-- Content Section -->
  {#if isLoading}
    <div class="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      <p class="text-slate-500 text-sm mt-3">Memuat jadwal ujian EPTUNU...</p>
    </div>

  {:else if sessions.length === 0}
    <div class="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <Calendar class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 class="text-base font-bold text-slate-700">Belum Ada Jadwal Ujian</h3>
      <p class="text-slate-500 text-xs mt-1">Klik "+ Buat Jadwal Ujian Baru" untuk menambah sesi ujian.</p>
    </div>

  {:else}
    <!-- EXAM SCHEDULE CARDS GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each sessions as s}
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 space-y-4">
          <!-- Card Header & Status -->
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 mb-1">
                {s.isActive ? 'SESI AKTIF' : 'NONAKTIF'}
              </span>
              <h3 class="text-base font-extrabold text-slate-900">{s.title}</h3>
            </div>

            <div class="flex items-center gap-1">
              <button on:click={() => openEditModal(s)} title="Edit Jadwal" class="p-2 text-slate-400 hover:text-indigo-600 rounded-lg">
                <Edit2 class="w-4 h-4" />
              </button>
              <button on:click={() => handleDeleteSchedule(s.id, s.title)} title="Hapus Jadwal" class="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Dynamic Token Box -->
          <div class="p-3.5 bg-slate-900 rounded-xl text-white flex items-center justify-between shadow-inner">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Key class="w-4 h-4" />
              </div>
              <div>
                <div class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Dynamic Token Ujian</div>
                <div class="font-mono text-lg font-black text-indigo-300 tracking-widest">{s.token}</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                on:click={() => copyToClipboard(s.token, s.id)}
                class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Salin Token"
              >
                {#if copiedTokenId === s.id}
                  <Check class="w-4 h-4 text-emerald-400" />
                {:else}
                  <Copy class="w-4 h-4" />
                {/if}
              </button>
              <button
                on:click={() => handleRegenerateToken(s)}
                class="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                title="Acak Ulang Token"
              >
                <RefreshCw class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Schedule Details Grid -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="flex items-start gap-2.5 text-slate-700">
              <Clock class="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <strong class="block text-slate-900">Waktu Mulai:</strong>
                {formatDate(s.startTime)}
              </div>
            </div>

            <div class="flex items-start gap-2.5 text-slate-700">
              <Clock class="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <strong class="block text-slate-900">Waktu Selesai:</strong>
                {formatDate(s.endTime)} ({s.durationMin} Menit)
              </div>
            </div>

            <div class="flex items-start gap-2.5 text-slate-700 col-span-2">
              <MapPin class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong class="block text-slate-900">Ruang Pelaksanaan:</strong>
                {s.room || 'Lab Komputer 1 UNU Purwokerto'}
              </div>
            </div>

            <div class="flex items-start gap-2.5 text-slate-700 col-span-2">
              <UserCheck class="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <strong class="block text-slate-900">Pengawas (Proctor):</strong>
                {s.proctor?.fullName || 'Pengawas Belum Ditugaskan'} ({s.proctor?.email || '-'})
              </div>
            </div>
          </div>

          <!-- Capacity Quota Progress Bar -->
          <div class="space-y-1.5 pt-1">
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-slate-600">Kapasitas Kuota Peserta</span>
              <span class="text-indigo-700">{s._count?.studentExams || 0} / {s.quota || 35} Kursi</span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                style="width: {Math.min(100, Math.round(((s._count?.studentExams || 0) / (s.quota || 35)) * 100))}%"
              ></div>
            </div>
          </div>

          <!-- Manual Start / Stop & Notification Action Buttons -->
          <div class="pt-2 border-t border-slate-100 space-y-2">
            <button
              on:click={() => handleSendReminder(s)}
              disabled={sendingReminderId === s.id}
              class="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Bell class="w-3.5 h-3.5 text-indigo-600" />
              <span>{sendingReminderId === s.id ? 'Mengirim Notifikasi...' : 'Kirim Pengingat H-1 (WA & Email)'}</span>
            </button>

            {#if s.isActive}
              <button
                on:click={() => handleStopSession(s)}
                class="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Power class="w-4 h-4 text-amber-600" /> Hentikan Sesi Ujian (Manual)
              </button>
            {:else}
              <button
                on:click={() => handleStartSession(s)}
                class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Play class="w-4 h-4 fill-current" /> Mulai Sesi Ujian Sekarang (Manual)
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
{/if}

<!-- CREATE / EDIT EXAM SESSION MODAL -->
{#if isModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
      <!-- Modal Header -->
      <div class="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <Calendar class="w-5 h-5 text-indigo-400" /> {modalTitle}
        </div>
        <button on:click={() => (isModalOpen = false)} class="text-slate-400 hover:text-white transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        <div>
          <label id="lbl-stitle" for="in-stitle" class="block text-xs font-semibold text-slate-700 mb-1">Judul / Sesi Ujian</label>
          <input
            id="in-stitle"
            type="text"
            bind:value={formData.title}
            placeholder="Contoh: EPT Regular Periode Juli 2026 - Sesi Pagi"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white placeholder:text-slate-400"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label id="lbl-stoken" for="in-stoken" class="block text-xs font-semibold text-slate-700 mb-1">Token Dynamic (6 Karakter)</label>
            <div class="flex items-center gap-2">
              <input
                id="in-stoken"
                type="text"
                bind:value={formData.token}
                maxlength="6"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono font-bold uppercase text-indigo-700 bg-white"
              />
              <button
                type="button"
                on:click={() => (formData.token = generateRandomToken())}
                class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                title="Acak Token"
              >
                <RefreshCw class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label id="lbl-sdur" for="in-sdur" class="block text-xs font-semibold text-slate-700 mb-1">Durasi Ujian (Menit)</label>
            <input
              id="in-sdur"
              type="number"
              bind:value={formData.durationMin}
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label id="lbl-sstart" for="in-sstart" class="block text-xs font-semibold text-slate-700 mb-1">Waktu Mulai Ujian</label>
            <input
              id="in-sstart"
              type="datetime-local"
              bind:value={formData.startTime}
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white"
            />
          </div>

          <div>
            <label id="lbl-send" for="in-send" class="block text-xs font-semibold text-slate-700 mb-1">Waktu Selesai Ujian</label>
            <input
              id="in-send"
              type="datetime-local"
              bind:value={formData.endTime}
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label id="lbl-sroom" for="in-sroom" class="block text-xs font-semibold text-slate-700 mb-1">Ruang Pelaksanaan Ujian</label>
            <input
              id="in-sroom"
              type="text"
              bind:value={formData.room}
              placeholder="Lab Komputer 1 / Lab Bahasa"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <label id="lbl-squota" for="in-squota" class="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Kuota Peserta</label>
            <input
              id="in-squota"
              type="number"
              bind:value={formData.quota}
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
            />
          </div>
        </div>

        <div>
          <label id="lbl-sproctor" for="sel-sproctor" class="block text-xs font-semibold text-slate-700 mb-1">Penugasan Pengawas (Proctor)</label>
          <select
            id="sel-sproctor"
            bind:value={formData.proctorId}
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-900 bg-white"
          >
            <option value="">-- Pilih Pengawas Ujian --</option>
            {#each proctors as p}
              <option value={p.id}>{p.fullName} ({p.role})</option>
            {/each}
          </select>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input
            id="in-sactive"
            type="checkbox"
            bind:checked={formData.isActive}
            class="w-4 h-4 text-indigo-600 rounded"
          />
          <label for="in-sactive" class="text-xs font-semibold text-slate-700">Aktifkan Sesi Ujian Ini</label>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => (isModalOpen = false)}
          class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
        >
          Batal
        </button>
        <button
          type="button"
          on:click={handleSaveSchedule}
          class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md"
        >
          Simpan Jadwal Ujian
        </button>
      </div>
    </div>
  </div>
{/if}
