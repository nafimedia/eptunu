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

  function formatOrdinalDate(dateInput: any) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = d.getDate();
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) suffix = 'st';
    else if (day % 10 === 2 && day !== 12) suffix = 'nd';
    else if (day % 10 === 3 && day !== 13) suffix = 'rd';
    return `${months[d.getMonth()]} ${day}${suffix}, ${d.getFullYear()}`;
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

<!-- PRINTABLE CERTIFICATE PREVIEW MODAL (A4 PORTRAIT) -->
{#if isPreviewModalOpen && selectedCert}
  {@const student = selectedCert.studentExam?.user}
  {@const scores = selectedCert.studentExam}
  {@const session = selectedCert.studentExam?.examSession}
  {@const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/verify/' + selectedCert.certificateNo)}`}

  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8">
      <!-- Modal Header (Non-printable) -->
      <div class="flex justify-between items-center border-b border-slate-800 pb-3 print:hidden">
        <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
          <Award class="w-4 h-4 text-emerald-400" />
          Pratinjau Sertifikat Resmi EPT (Ukuran A4 Portrait)
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

      <!-- CERTIFICATE TEMPLATE BODY (EXACT A4 PORTRAIT PRINTABLE AREA MATCHING SAMPLE REDAKSI) -->
      <div
        id="certificate-print-area"
        class="bg-[#faf8f5] text-slate-900 px-8 py-12 sm:px-12 sm:py-16 relative shadow-2xl font-serif print:m-0 print:shadow-none mx-auto w-full aspect-[210/297] flex flex-col justify-between overflow-hidden bg-cover bg-center bg-no-repeat"
        style="background-image: url('/certificate_bg.jpg');"
      >
        <!-- Background Seal Watermark -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
          <img src="/logo.png" alt="Watermark UNU" class="w-80 h-80 object-contain" />
        </div>

        <!-- Top Content (Header, Title, Identity, Attestation, Scores) -->
        <div class="relative z-10 space-y-4 pt-2">

          <!-- 1. Header (Kop Surat) -->
          <div class="text-center relative pb-3 border-b-2 border-double border-slate-900/60">
            <img src="/logo.png" alt="UNU Purwokerto Logo" class="w-16 h-16 object-contain mx-auto mb-2" />
            <div class="text-xs sm:text-sm font-sans font-extrabold tracking-wide text-emerald-800 uppercase">
              UNIVERSITY OF NAHDLATUL ULAMA PURWOKERTO
            </div>
            <div class="text-base sm:text-xl font-sans font-black text-amber-600 uppercase tracking-wider my-0.5">
              LANGUAGE CENTER
            </div>
            <div class="text-[9px] font-sans text-slate-600 leading-tight">
              Jln. Sultan Agung No. 42, Karangklesem, Purwokerto Selatan, Purwokerto, Central Java, 53144<br />
              Tel./Fax. (0281) 6841836; e-mail: uptbahasa@unupurwokerto.ac.id; website: www.unupurwokerto.ac.id
            </div>
          </div>

          <!-- 2. Certificate Title -->
          <div class="text-center pt-2 pb-1">
            <h2 class="text-2xl sm:text-3xl font-sans font-black text-amber-600 tracking-wider uppercase mb-0.5">
              EPTUNU CERTIFICATE
            </h2>
            <p class="text-xs italic text-slate-800 font-serif font-medium">
              (English Proficiency Test of UNU Purwokerto)
            </p>
            <div class="text-xs font-sans font-bold text-slate-900 mt-1 border-b border-slate-400/80 inline-block pb-0.5 px-3">
              No.: &nbsp; {selectedCert.certificateNo}
            </div>
          </div>

          <!-- 3. Identity Block (This is to certify that) -->
          <div class="text-xs text-slate-800 font-sans space-y-2 pt-1 px-4">
            <p class="text-xs font-serif italic text-slate-700">This is to certify that</p>
            
            <div class="grid grid-cols-[130px_10px_1fr] gap-x-2 text-xs font-sans items-center pl-6">
              <span class="font-semibold text-slate-800">name</span>
              <span>:</span>
              <span class="font-bold text-slate-900 text-sm">{student?.fullName || '-'}</span>
              
              <span class="font-semibold text-slate-800">student number</span>
              <span>:</span>
              <span class="font-bold text-slate-900 font-mono text-sm">{student?.identityNumber || '-'}</span>
            </div>
          </div>

          <!-- 4. Attestation Text -->
          <div class="px-4 text-xs font-sans text-slate-800 leading-relaxed pt-1">
            <p class="text-justify">
              took English Proficiency Test of UNU Purwokerto organized by Language Center of UNU Purwokerto on 
              <span class="font-semibold">{formatOrdinalDate(selectedCert.issuedAt)}</span> 
              and achieved the following scores:
            </p>
          </div>

          <!-- 5. Scores Breakdown List -->
          <div class="px-8 py-1 font-sans text-xs text-slate-900 max-w-lg mx-auto">
            <div class="space-y-1.5">
              <div class="flex justify-between items-center border-b border-slate-200/60 pb-1">
                <span>1. Listening Comprehension</span>
                <span class="font-bold font-mono text-sm">{scores?.scoreListening || 0}</span>
              </div>
              <div class="flex justify-between items-center border-b border-slate-200/60 pb-1">
                <span>2. Structure and Written Expression</span>
                <span class="font-bold font-mono text-sm">{scores?.scoreStructure || 0}</span>
              </div>
              <div class="flex justify-between items-center border-b border-slate-200/60 pb-1">
                <span>3. Reading Comprehension</span>
                <span class="font-bold font-mono text-sm">{scores?.scoreReading || 0}</span>
              </div>
              <div class="border-t-2 border-slate-800 pt-1.5 flex justify-between items-center font-bold">
                <span class="text-sm">Total</span>
                <span class="font-black font-mono text-base text-amber-900">{scores?.totalScore || 0}</span>
              </div>
            </div>
          </div>

          <!-- 6. Held statement -->
          <div class="px-4 text-xs font-sans text-slate-800 pt-1">
            <p>The English Proficiency Test was held in UNU Purwokerto</p>
          </div>

        </div>

        <!-- Bottom Content (Footer, Signatures & QR Code) -->
        <div class="relative z-10 px-4 pb-2">
          <div class="flex justify-between items-end text-xs font-sans">
            
            <!-- QR Code Box (Bottom Left) -->
            <div class="text-center">
              <div class="p-1.5 bg-white border border-slate-400 rounded-lg inline-block shadow-sm">
                <img src={qrUrl} alt="QR Code Verifikasi" class="w-20 h-20" />
              </div>
              <span class="text-[8px] text-slate-500 font-sans block mt-1">Scan to Verify Authenticity</span>
            </div>

            <!-- Signature Block (Bottom Right) -->
            <div class="text-center space-y-0.5 min-w-[230px]">
              <p class="text-xs text-slate-800 font-sans">Purwokerto, {formatOrdinalDate(selectedCert.issuedAt)}</p>
              <p class="text-xs font-bold text-slate-900 font-sans">Head of Language Center,</p>
              
              <div class="h-16 flex items-center justify-center my-1">
                {#if selectedCert.signerSignatureUrl || systemSettings?.signerSignatureUrl}
                  <img src={selectedCert.signerSignatureUrl || systemSettings?.signerSignatureUrl} alt="Tanda Tangan Kepala UPT Bahasa" class="max-h-16 max-w-[180px] object-contain mx-auto" />
                {:else}
                  <div class="italic text-amber-900 font-bold opacity-80 text-xs border border-amber-900/30 rounded-lg px-3 py-1 bg-amber-50/50">[ Digital Signature Verified ]</div>
                {/if}
              </div>
              
              <p class="text-xs font-bold text-slate-900 underline font-sans">
                {selectedCert.signerName || systemSettings?.signerName || 'M. Happy Nur Tsani, S.Pd., M.Pd.'}
              </p>
              <p class="text-[10px] text-slate-700 font-mono">
                NPP: {selectedCert.signerNip || systemSettings?.signerNip || '19871208 201707 1 073'}
              </p>
            </div>

          </div>

          <!-- SHA-256 Hash Line -->
          <div class="mt-3 pt-1.5 border-t border-slate-300 text-[8px] font-sans text-slate-500 flex justify-between">
            <span>SHA-256 Signature: {selectedCert.verificationHash || 'SHA256-VERIFIED'}</span>
            <span>Valid Until: {formatOrdinalDate(selectedCert.validUntil)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @media print {
    @page {
      size: A4 portrait;
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
      width: 210mm !important;
      height: 297mm !important;
      padding: 22mm 18mm 26mm 18mm !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      background-image: url('/certificate_bg.jpg') !important;
      background-size: 100% 100% !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border: none !important;
      z-index: 99999 !important;
    }
  }
</style>
