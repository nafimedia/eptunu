<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { auth } from '$stores/auth';
  import { toast } from 'svelte-sonner';
  import {
    Award,
    CheckCircle2,
    XCircle,
    Search,
    Edit3,
    FileCheck,
    Download,
    Calendar,
    Shield,
    Sparkles,
    RefreshCw,
    UserCheck,
    BarChart3
  } from 'lucide-svelte';

  let results: any[] = [];
  let isLoading = true;
  let search = '';
  let selectedSessionId = '';
  let sessions: any[] = [];
  let passingScore = 450;

  // Manual Override Modal
  let isOverrideModalOpen = false;
  let selectedExam: any = null;
  let overrideForm = {
    scoreListening: 31,
    scoreStructure: 31,
    scoreReading: 31,
    totalScore: 310,
  };
  let isSavingOverride = false;

  // Role checks
  $: currentUser = $auth.user;
  $: isAdmin = currentUser?.role && ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR'].includes(currentUser.role);

  onMount(async () => {
    await Promise.all([loadSettings(), loadSessions(), loadResults()]);
  });

  async function loadSettings() {
    try {
      const res = await apiFetch('/settings');
      if (res.data?.passingScore) {
        passingScore = res.data.passingScore;
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSessions() {
    try {
      const res = await apiFetch('/exam-sessions');
      sessions = res.data || [];
    } catch (e) {
      console.error(e);
    }
  }

  async function loadResults() {
    isLoading = true;
    try {
      if (isAdmin) {
        let query = `?search=${encodeURIComponent(search)}`;
        if (selectedSessionId) query += `&sessionId=${selectedSessionId}`;
        const res = await apiFetch(`/exam/results${query}`);
        results = res.data || [];
      } else {
        const res = await apiFetch('/exam/my-exams');
        results = res.data || [];
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat hasil tes');
    } finally {
      isLoading = false;
    }
  }

  function openOverrideModal(item: any) {
    selectedExam = item;
    overrideForm = {
      scoreListening: item.scoreListening || 31,
      scoreStructure: item.scoreStructure || 31,
      scoreReading: item.scoreReading || 31,
      totalScore: item.totalScore || 310,
    };
    isOverrideModalOpen = true;
  }

  // Calculate total dynamically on input change
  function recalculateTotal() {
    const l = Number(overrideForm.scoreListening) || 0;
    const s = Number(overrideForm.scoreStructure) || 0;
    const r = Number(overrideForm.scoreReading) || 0;
    overrideForm.totalScore = Math.round(((l + s + r) * 10) / 3);
  }

  async function handleSaveOverride() {
    if (!selectedExam) return;
    isSavingOverride = true;
    try {
      const res = await apiFetch(`/exam/results/${selectedExam.id}/override`, {
        method: 'PUT',
        body: JSON.stringify(overrideForm),
      });
      toast.success(res.message || 'Koreksi nilai berhasil disimpan');
      isOverrideModalOpen = false;
      await loadResults();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengoreksi nilai');
    } finally {
      isSavingOverride = false;
    }
  }

  async function handleIssueCertificate(studentExamId: string) {
    try {
      const res = await apiFetch('/certificates/issue', {
        method: 'POST',
        body: JSON.stringify({ studentExamId }),
      });
      toast.success(res.message || 'Sertifikat berhasil diterbitkan!');
      await loadResults();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menerbitkan sertifikat');
    }
  }
</script>

<svelte:head>
  <title>Hasil Tes & Penilaian - EPTUNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header Banner -->
  <div class="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 p-6 rounded-3xl border border-indigo-800/40 shadow-2xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <Award class="w-6 h-6 text-indigo-400" />
        <h1 class="text-xl font-extrabold tracking-tight">Hasil Ujian & Penilaian EPT</h1>
      </div>
      <p class="text-xs text-slate-300">
        Koreksi otomatis TOEFL ITP score conversion, status kelulusan, & penerbitan sertifikat resmi UPT Bahasa UNU Purwokerto.
      </p>
    </div>
    <button
      on:click={loadResults}
      class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl border border-indigo-500/30 transition shadow-lg"
    >
      <RefreshCw class="w-3.5 h-3.5" />
      <span>Refresh Data</span>
    </button>
  </div>

  <!-- Filters & Search (Admin View) -->
  {#if isAdmin}
    <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
      <div class="relative w-full md:w-80">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nama, NIM, atau judul ujian..."
          bind:value={search}
          on:input={loadResults}
          class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <select
          bind:value={selectedSessionId}
          on:change={loadResults}
          class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Semua Sesi Ujian</option>
          {#each sessions as s}
            <option value={s.id}>{s.title}</option>
          {/each}
        </select>
      </div>
    </div>
  {/if}

  <!-- Results Cards / Table -->
  {#if isLoading}
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
      <RefreshCw class="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
      Memuat hasil tes...
    </div>
  {:else if results.length === 0}
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
      Belum ada riwayat hasil tes.
    </div>
  {:else if !isAdmin}
    <!-- STUDENT RESULT VIEW CARDS -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each results as exam}
        {@const isPassed = (exam.totalScore || 0) >= passingScore}
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div class="absolute top-0 right-0 p-4">
            <span class={`px-3 py-1 text-xs font-bold rounded-full uppercase border ${isPassed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
              {isPassed ? 'LULUS' : 'TIDAK LULUS'}
            </span>
          </div>

          <div>
            <h3 class="text-sm font-bold text-white mb-1 pr-24">{exam.examSession?.title || 'Sesi EPT'}</h3>
            <p class="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-indigo-400" />
              <span>Tanggal: {exam.submittedAt ? new Date(exam.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
            </p>

            <div class="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center mb-4">
              <div>
                <span class="block text-[10px] text-slate-400 uppercase font-semibold">Listening</span>
                <span class="text-sm font-extrabold text-indigo-400">{exam.scoreListening || '-'}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 uppercase font-semibold">Structure</span>
                <span class="text-sm font-extrabold text-indigo-400">{exam.scoreStructure || '-'}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 uppercase font-semibold">Reading</span>
                <span class="text-sm font-extrabold text-indigo-400">{exam.scoreReading || '-'}</span>
              </div>
              <div class="border-l border-slate-800 pl-1">
                <span class="block text-[10px] text-slate-400 uppercase font-semibold">Total</span>
                <span class={`text-base font-extrabold ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>{exam.totalScore || '-'}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span class="text-slate-400 text-[11px]">Masa Berluku: 2 Tahun</span>
            {#if exam.certificate}
              <a
                href="/dashboard/certificates"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow transition"
              >
                <FileCheck class="w-3.5 h-3.5" />
                <span>Lihat Sertifikat</span>
              </a>
            {:else if isPassed}
              <span class="text-slate-500 text-[11px]">Sertifikat sedang diproses</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- ADMIN RESULTS TABLE VIEW -->
    <div class="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th class="p-4">Peserta / NIM</th>
              <th class="p-4">Fakultas / Prodi</th>
              <th class="p-4">Sesi Ujian</th>
              <th class="p-4 text-center">Listening</th>
              <th class="p-4 text-center">Structure</th>
              <th class="p-4 text-center">Reading</th>
              <th class="p-4 text-center">Total Skor</th>
              <th class="p-4 text-center">Status</th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            {#each results as item}
              {@const isPassed = (item.totalScore || 0) >= passingScore}
              <tr class="hover:bg-slate-800/30 transition">
                <td class="p-4">
                  <div class="font-bold text-white">{item.user?.fullName || '-'}</div>
                  <div class="text-[11px] text-indigo-400 font-mono">{item.user?.identityNumber || '-'}</div>
                </td>
                <td class="p-4">
                  <div>{item.user?.faculty || '-'}</div>
                  <div class="text-[11px] text-slate-400">{item.user?.prodi || '-'}</div>
                </td>
                <td class="p-4 text-slate-300 font-medium">{item.examSession?.title || '-'}</td>
                <td class="p-4 text-center font-mono font-bold text-slate-200">{item.scoreListening || 0}</td>
                <td class="p-4 text-center font-mono font-bold text-slate-200">{item.scoreStructure || 0}</td>
                <td class="p-4 text-center font-mono font-bold text-slate-200">{item.scoreReading || 0}</td>
                <td class="p-4 text-center font-mono font-extrabold text-indigo-400 text-sm">{item.totalScore || 0}</td>
                <td class="p-4 text-center">
                  <span class={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${isPassed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                    {isPassed ? 'LULUS' : 'TIDAK LULUS'}
                  </span>
                </td>
                <td class="p-4 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      on:click={() => openOverrideModal(item)}
                      title="Koreksi Manual Skor"
                      class="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition"
                    >
                      <Edit3 class="w-3.5 h-3.5" />
                    </button>
                    {#if isPassed && !item.certificate}
                      <button
                        on:click={() => handleIssueCertificate(item.id)}
                        title="Terbitkan Sertifikat"
                        class="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] transition shadow"
                      >
                        Cetak Sertifikat
                      </button>
                    {:else if item.certificate}
                      <span class="text-[10px] text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded">Telah Terbit</span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- MANUAL SCORE OVERRIDE MODAL -->
{#if isOverrideModalOpen}
  <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
          <Edit3 class="w-4 h-4 text-indigo-400" />
          Koreksi Manual Nilai EPT
        </h3>
        <button on:click={() => (isOverrideModalOpen = false)} class="text-slate-400 hover:text-white">✕</button>
      </div>

      {#if selectedExam}
        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
          <div class="font-bold text-white">{selectedExam.user?.fullName}</div>
          <div class="text-[11px] text-indigo-400 font-mono">{selectedExam.user?.identityNumber}</div>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label for="ov-listening" class="block text-slate-400 mb-1">Skor Konversi Listening (31 - 68)</label>
            <input
              id="ov-listening"
              type="number"
              bind:value={overrideForm.scoreListening}
              on:input={recalculateTotal}
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label for="ov-structure" class="block text-slate-400 mb-1">Skor Konversi Structure (31 - 68)</label>
            <input
              id="ov-structure"
              type="number"
              bind:value={overrideForm.scoreStructure}
              on:input={recalculateTotal}
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label for="ov-reading" class="block text-slate-400 mb-1">Skor Konversi Reading (31 - 67)</label>
            <input
              id="ov-reading"
              type="number"
              bind:value={overrideForm.scoreReading}
              on:input={recalculateTotal}
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div class="bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40 text-center">
            <span class="block text-[11px] text-indigo-300 font-semibold uppercase">Total Skor EPT</span>
            <span class="text-xl font-black text-indigo-400 font-mono">{overrideForm.totalScore}</span>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            on:click={() => (isOverrideModalOpen = false)}
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Batal
          </button>
          <button
            on:click={handleSaveOverride}
            disabled={isSavingOverride}
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
          >
            {isSavingOverride ? 'Menyimpan...' : 'Simpan Koreksi'}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
