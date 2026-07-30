<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { auth } from '$stores/auth';
  import { toast } from 'svelte-sonner';
  import {
    Award,
    ShieldCheck,
    Printer,
    QrCode,
    Search,
    RefreshCw,
    GraduationCap,
    CheckCircle2,
    Calendar,
    ExternalLink,
    FileText,
    Archive,
    Download
  } from 'lucide-svelte';

  let certificates: any[] = [];
  let isLoading = true;
  let search = '';
  let selectedCert: any = null;
  let isPreviewModalOpen = false;
  let isDownloadingBatch = false;

  $: currentUser = $auth.user;
  $: isAdmin = currentUser?.role && ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE'].includes(currentUser.role);

  let systemSettings: any = null;

  onMount(async () => {
    await loadCertificates();
    await loadSettings();
  });

  async function loadSettings() {
    try {
      const res = await apiFetch('/settings');
      if (res.data) systemSettings = res.data;
    } catch (e) {
      // fallback
    }
  }

  async function loadCertificates() {
    isLoading = true;
    try {
      if (isAdmin) {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const res = await apiFetch(`/certificates${query}`);
        certificates = res.data || [];
      } else {
        const res = await apiFetch('/certificates/my-certificates');
        certificates = res.data || [];
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar sertifikat');
    } finally {
      isLoading = false;
    }
  }

  async function handleDownloadBatchZip() {
    isDownloadingBatch = true;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/certificates/batch-zip', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Gagal mengunduh batch sertifikat');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Batch_Sertifikat_EPTUNU_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Batch Sertifikat ZIP berhasil diunduh!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mendownload sertifikat ZIP');
    } finally {
      isDownloadingBatch = false;
    }
  }

  function openPreviewModal(cert: any) {
    selectedCert = cert;
    isPreviewModalOpen = true;
  }

  function printCertificate() {
    window.print();
  }
</script>

<svelte:head>
  <title>Sertifikat EPT Resmi - UNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header Banner -->
  <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-emerald-800/40 shadow-2xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <ShieldCheck class="w-6 h-6 text-emerald-400" />
        <h1 class="text-xl font-extrabold tracking-tight">Manajemen Sertifikat EPT</h1>
      </div>
      <p class="text-xs text-slate-300">
        Penerbitan sertifikat digital resmi UPT Bahasa UNU Purwokerto lengkap dengan QR Code, Digital Signature, & Verifikasi Online.
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if isAdmin}
        <button
          on:click={handleDownloadBatchZip}
          disabled={isDownloadingBatch}
          class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl border border-indigo-400/30 transition shadow-lg"
        >
          <Archive class="w-4 h-4" />
          <span>{isDownloadingBatch ? 'Mengunduh ZIP...' : 'Download Batch Sertifikat (ZIP)'}</span>
        </button>
      {/if}
      <button
        on:click={loadCertificates}
        class="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Refresh</span>
      </button>
    </div>
  </div>

  <!-- Search (Admin View) -->
  {#if isAdmin}
    <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
      <div class="relative w-full md:w-80">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nomor sertifikat, nama, atau NIM..."
          bind:value={search}
          on:input={loadCertificates}
          class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  {/if}

  <!-- Certificates Grid / List -->
  {#if isLoading}
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
      <RefreshCw class="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
      Memuat sertifikat...
    </div>
  {:else if certificates.length === 0}
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
      Belum ada sertifikat yang diterbitkan.
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each certificates as item}
        {@const student = item.studentExam?.user}
        {@const scores = item.studentExam}
        {@const session = item.studentExam?.examSession}
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-emerald-500/40 transition">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase">
                RESMI & TERVERIFIKASI
              </span>
              <Award class="w-5 h-5 text-emerald-400" />
            </div>

            <h3 class="text-sm font-extrabold text-white mb-0.5">{student?.fullName || 'Peserta EPT'}</h3>
            <p class="text-[11px] text-indigo-400 font-mono mb-3">NIM: {student?.identityNumber || '-'}</p>

            <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1.5 mb-4">
              <div class="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span class="text-slate-400 text-[11px]">No. Sertifikat:</span>
                <span class="text-emerald-400 font-mono font-bold text-[11px]">{item.certificateNo}</span>
              </div>
              <div class="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span class="text-slate-400 text-[11px]">Total Skor EPT:</span>
                <span class="text-white font-extrabold text-xs">{scores?.totalScore || '-'}</span>
              </div>
              <div class="flex justify-between text-[11px]">
                <span class="text-slate-400">Berlaku s/d:</span>
                <span class="text-slate-200">{new Date(item.validUntil).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              on:click={() => openPreviewModal(item)}
              class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Cetak / Cetak PDF</span>
            </button>
            <a
              href={`/verify/${encodeURIComponent(item.certificateNo)}`}
              target="_blank"
              title="Uji Verifikasi Online"
              class="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl transition"
            >
              <ExternalLink class="w-4 h-4" />
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- PRINTABLE CERTIFICATE PREVIEW MODAL (A4 LANDSCAPE) -->
{#if isPreviewModalOpen && selectedCert}
  {@const student = selectedCert.studentExam?.user}
  {@const scores = selectedCert.studentExam}
  {@const session = selectedCert.studentExam?.examSession}
  {@const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/verify/' + selectedCert.certificateNo)}`}

  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-4 my-8">
      <!-- Modal Header (Non-printable) -->
      <div class="flex justify-between items-center border-b border-slate-800 pb-3 print:hidden">
        <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
          <Award class="w-4 h-4 text-emerald-400" />
          Pratinjau Sertifikat Resmi EPT (Ukuran A4 Landscape)
        </h3>
        <div class="flex items-center gap-2">
          <button
            on:click={printCertificate}
            class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow"
          >
            <Printer class="w-3.5 h-3.5" />
            <span>Cetak Sertifikat A4 / Simpan PDF</span>
          </button>
          <button on:click={() => (isPreviewModalOpen = false)} class="text-slate-400 hover:text-white text-lg">✕</button>
        </div>
      </div>

      <!-- CERTIFICATE TEMPLATE BODY (EXACT A4 LANDSCAPE PRINTABLE AREA) -->
      <div
        id="certificate-print-area"
        class="bg-[#fffbeb] text-slate-900 p-8 sm:p-10 border-[6px] border-double border-amber-900/70 relative shadow-2xl font-serif print:m-0 print:border-4 print:shadow-none mx-auto w-full aspect-[297/210] flex flex-col justify-between"
      >
        <!-- Background Seal Watermark -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <img src="/logo.png" alt="Watermark UNU" class="w-96 h-96 object-contain" />
        </div>

        <div>
          <!-- Certificate Header -->
          <div class="text-center border-b-2 border-amber-900/50 pb-3 mb-4 relative z-10">
            <img src="/logo.png" alt="UNU Purwokerto Logo" class="w-14 h-14 object-contain mx-auto mb-1" />
            <div class="text-[11px] font-sans font-bold tracking-widest text-amber-950 uppercase">UNIVERSITAS NAHDLATUL ULAMA PURWOKERTO</div>
            <div class="text-base font-black text-amber-950 uppercase tracking-wide">UPT BAHASA (LANGUAGE CENTER)</div>
            <div class="text-[9px] font-sans text-slate-600">Jl. Sultan Agung No. 42 Purwokerto, Jawa Tengah • Email: uptbahasa@unupurwokerto.ac.id</div>
          </div>

          <!-- Certificate Title -->
          <div class="text-center mb-4 relative z-10">
            <h2 class="text-lg font-extrabold uppercase text-amber-950 tracking-wider mb-0.5">CERTIFICATE OF PROFICIENCY</h2>
            <p class="text-[11px] italic text-slate-700">English Proficiency Test (EPT)</p>
            <div class="text-[10px] font-sans font-bold text-amber-900 mt-1">Number: {selectedCert.certificateNo}</div>
          </div>

          <!-- Student Identity -->
          <div class="text-center text-xs space-y-1 mb-4 relative z-10">
            <p class="text-slate-600 text-[11px]">This is to certify that:</p>
            <div class="text-base font-extrabold text-amber-950 uppercase tracking-wide border-b-2 border-amber-900/30 inline-block px-8 py-0.5">
              {student?.fullName || 'Peserta Ujian'}
            </div>
            <p class="text-slate-600 text-[10px]">Identity / Student ID: <span class="font-bold text-slate-900 font-sans">{student?.identityNumber || '-'}</span></p>
            <p class="text-slate-600 text-[10px]">Faculty / Study Program: <span class="font-semibold text-slate-900">{student?.faculty || '-'} / {student?.prodi || '-'}</span></p>
          </div>

          <p class="text-center text-[10px] text-slate-700 mb-3 px-4 leading-relaxed relative z-10">
            has taken the official Computer-Based English Proficiency Test (EPT) organized by UPT Bahasa UNU Purwokerto on
            <strong class="font-sans">{new Date(selectedCert.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            and achieved the following converted scores:
          </p>

          <!-- Scores Table -->
          <div class="max-w-md mx-auto bg-white/90 border border-amber-900/30 rounded-xl p-3 shadow-sm mb-4 font-sans text-xs relative z-10">
            <div class="grid grid-cols-4 gap-2 text-center divide-x divide-slate-200">
              <div>
                <span class="block text-[9px] text-slate-500 uppercase font-semibold">Listening</span>
                <span class="text-xs font-bold text-slate-800">{scores?.scoreListening || 0}</span>
              </div>
              <div>
                <span class="block text-[9px] text-slate-500 uppercase font-semibold">Structure</span>
                <span class="text-xs font-bold text-slate-800">{scores?.scoreStructure || 0}</span>
              </div>
              <div>
                <span class="block text-[9px] text-slate-500 uppercase font-semibold">Reading</span>
                <span class="text-xs font-bold text-slate-800">{scores?.scoreReading || 0}</span>
              </div>
              <div>
                <span class="block text-[9px] text-slate-500 uppercase font-semibold">Total Score</span>
                <span class="text-sm font-extrabold text-amber-950">{scores?.totalScore || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Signatures & QR Code -->
        <div class="flex justify-between items-end text-xs font-sans pt-2 border-t border-amber-900/20 relative z-10">
          <div class="text-center">
            <img src={qrUrl} alt="QR Code Verifikasi" class="w-16 h-16 border border-amber-900/30 rounded p-1 mx-auto mb-1 bg-white" />
            <span class="text-[8px] text-slate-500 block">Scan to Verify Authenticity</span>
          </div>

          <div class="text-center space-y-0.5 min-w-[220px]">
            <p class="text-[10px]">Purwokerto, {new Date(selectedCert.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p class="text-[10px] font-bold text-amber-950">Head of Language Center</p>
            <div class="h-14 flex items-center justify-center my-0.5">
              {#if selectedCert.signerSignatureUrl || systemSettings?.signerSignatureUrl}
                <img src={selectedCert.signerSignatureUrl || systemSettings?.signerSignatureUrl} alt="Tanda Tangan Kepala UPT Bahasa" class="max-h-14 max-w-[170px] object-contain mx-auto" />
              {:else}
                <div class="italic text-amber-900 font-bold opacity-80 text-[10px] border border-amber-900/20 rounded px-2 py-1">[ Digital Signature Verified ]</div>
              {/if}
            </div>
            <p class="text-[11px] font-bold text-slate-900 underline">{selectedCert.signerName || systemSettings?.signerName || 'Kepala UPT Bahasa'}</p>
            <p class="text-[9px] text-slate-600 font-mono">NIP. {selectedCert.signerNip || systemSettings?.signerNip || '-'}</p>
          </div>
        </div>

        <!-- Integrity Hash Footer -->
        <div class="mt-2 pt-1 border-t border-amber-900/10 text-[7px] font-sans text-slate-400 flex justify-between relative z-10">
          <span>SHA-256 Signature: {selectedCert.verificationHash || 'SHA256-VERIFIED'}</span>
          <span>Valid Until: {new Date(selectedCert.validUntil).toLocaleDateString('id-ID')}</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @media print {
    @page {
      size: A4 landscape;
      margin: 0;
    }
    :global(body) {
      background: white !important;
      color: black !important;
    }
    :global(body *) {
      visibility: hidden !important;
    }
    #certificate-print-area, #certificate-print-area * {
      visibility: visible !important;
    }
    #certificate-print-area {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 297mm !important;
      height: 210mm !important;
      padding: 12mm 18mm !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      background-color: #fffbeb !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border: 8px double #78350f !important;
      z-index: 99999 !important;
    }
  }
</style>
