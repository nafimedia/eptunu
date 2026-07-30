<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import {
    FileText,
    Search,
    Clock,
    User,
    HardDrive,
    Shield,
    KeyRound,
    Edit3,
    Award,
    RefreshCw,
    Filter,
    Activity
  } from 'lucide-svelte';

  let logs: any[] = [];
  let isLoading = true;
  let searchQuery = '';
  let selectedAction = '';
  let selectedLog: any = null;
  let isDetailModalOpen = false;

  async function fetchAuditLogs() {
    isLoading = true;
    try {
      let queryParams = '?limit=50';
      if (searchQuery) queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedAction) queryParams += `&action=${encodeURIComponent(selectedAction)}`;
      const res = await apiFetch(`/audit-logs${queryParams}`);
      logs = res.data || [];
    } catch (e) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  function getActionBadgeStyle(action: string) {
    if (action.includes('LOGIN')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    if (action.includes('EDIT') || action.includes('SOAL')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (action.includes('PUBLISH') || action.includes('NILAI')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (action.includes('SERTIFIKAT')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  }

  function openDetailModal(log: any) {
    selectedLog = log;
    isDetailModalOpen = true;
  }

  onMount(() => {
    fetchAuditLogs();
  });
</script>

<svelte:head>
  <title>Audit Log Aktivitas - EPTUNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header Banner -->
  <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 shadow-2xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <Activity class="w-6 h-6 text-indigo-400" />
        <h1 class="text-xl font-extrabold tracking-tight">Audit Log Aktivitas Sistem</h1>
      </div>
      <p class="text-xs text-slate-300">
        Catatan transparan aktivitas pengguna: Login, Edit Soal, Publish Nilai, Cetak Sertifikat, & Perubahan Data.
      </p>
    </div>
    <button
      on:click={fetchAuditLogs}
      class="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition shadow"
    >
      <RefreshCw class="w-3.5 h-3.5" />
      <span>Refresh Audit Log</span>
    </button>
  </div>

  <!-- Filters & Search -->
  <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
    <div class="relative w-full sm:w-80">
      <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        bind:value={searchQuery}
        on:input={fetchAuditLogs}
        placeholder="Cari aktivitas, entitas, IP, atau pengguna..."
        class="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
      />
    </div>

    <div class="flex items-center gap-2 w-full sm:w-auto">
      <Filter class="w-3.5 h-3.5 text-slate-400" />
      <select
        bind:value={selectedAction}
        on:change={fetchAuditLogs}
        class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
      >
        <option value="">Semua Jenis Aktivitas</option>
        <option value="LOGIN">Aktivitas Login</option>
        <option value="EDIT_SOAL">Edit & Tambah Soal</option>
        <option value="PUBLISH_NILAI">Publish & Koreksi Nilai</option>
        <option value="CETAK_SERTIFIKAT">Cetak Sertifikat</option>
        <option value="PERUBAHAN_DATA">Perubahan Data Sistem</option>
      </select>
    </div>
  </div>

  <!-- Audit Log List -->
  <div class="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
    {#if isLoading}
      <div class="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw class="w-4 h-4 animate-spin text-indigo-400" />
        <span>Memuat catatan audit log sistem...</span>
      </div>
    {:else if logs.length === 0}
      <div class="p-12 text-center text-xs text-slate-400">Tidak ada catatan audit log yang cocok.</div>
    {:else}
      <div class="divide-y divide-slate-800/60">
        {#each logs as log}
          <button
            type="button"
            on:click={() => openDetailModal(log)}
            class="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 cursor-pointer transition text-xs"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getActionBadgeStyle(log.action)}`}>
                  {log.action}
                </span>
                <span class="text-slate-400 font-medium text-[11px]">{log.entity || log.targetModule || 'System'}</span>
              </div>
              <p class="text-slate-200 font-medium">
                {log.details || 'Penyesuaian konfigurasi atau mutasi data sistem.'}
              </p>
              <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                <User class="w-3 h-3 text-indigo-400" />
                <span class="text-slate-300 font-bold">{log.user?.fullName || log.userName || 'System Admin'}</span>
                <span>({log.user?.email || 'System'})</span>
              </div>
            </div>

            <div class="flex items-center gap-4 text-slate-400 text-[11px] shrink-0">
              <span class="flex items-center gap-1 font-mono"><HardDrive class="w-3.5 h-3.5 text-indigo-400" /> {log.ipAddress || '127.0.0.1'}</span>
              <span class="flex items-center gap-1"><Clock class="w-3.5 h-3.5 text-slate-500" /> {new Date(log.createdAt).toLocaleString('id-ID')}</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- AUDIT DETAIL MODAL -->
{#if isDetailModalOpen && selectedLog}
  <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
          <Activity class="w-4 h-4 text-indigo-400" />
          Rincian Audit Log
        </h3>
        <button on:click={() => (isDetailModalOpen = false)} class="text-slate-400 hover:text-white">✕</button>
      </div>

      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
        <div class="flex justify-between border-b border-slate-800/80 pb-2">
          <span class="text-slate-400">Tindakan / Action:</span>
          <span class="font-bold text-indigo-400 uppercase">{selectedLog.action}</span>
        </div>
        <div class="flex justify-between border-b border-slate-800/80 pb-2">
          <span class="text-slate-400">Pengguna / Eksekutor:</span>
          <span class="text-white font-bold">{selectedLog.user?.fullName || selectedLog.userName || 'System'}</span>
        </div>
        <div class="flex justify-between border-b border-slate-800/80 pb-2">
          <span class="text-slate-400">Alamat IP:</span>
          <span class="text-emerald-400 font-mono">{selectedLog.ipAddress || '127.0.0.1'}</span>
        </div>
        <div class="flex justify-between border-b border-slate-800/80 pb-2">
          <span class="text-slate-400">Waktu Kejadian:</span>
          <span class="text-slate-200">{new Date(selectedLog.createdAt).toLocaleString('id-ID')}</span>
        </div>
        <div class="pt-2">
          <span class="text-slate-400 block mb-1 font-bold">Deskripsi Rincian:</span>
          <p class="text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
            {selectedLog.details || 'Tidak ada catatan rincian tambahan.'}
          </p>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          on:click={() => (isDetailModalOpen = false)}
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}
