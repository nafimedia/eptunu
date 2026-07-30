<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { auth } from '$stores/auth';
  import { toast } from 'svelte-sonner';
  import {
    UserCheck,
    Calendar,
    Upload,
    Printer,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    QrCode,
    Plus,
    X,
    Building,
    CreditCard,
    AlertCircle,
    Eye
  } from 'lucide-svelte';

  type TabType = 'myRegistrations' | 'verifyOperator';

  let activeTab: TabType = 'myRegistrations';
  let isLoading = true;

  $: user = $auth.user;
  $: userRole = (user?.role || '').toUpperCase();
  $: isAdminOrOperator = ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE'].includes(userRole);

  // Data State
  let myRegistrations: any[] = [];
  let availableSessions: any[] = [];
  let allRegistrations: any[] = [];

  // Filter State for Admin
  let filterStatus = '';
  let searchQuery = '';

  // Payment Upload Modal State
  let isPaymentModalOpen = false;
  let targetRegForPayment: any = null;
  let isUploadingPayment = false;
  let uploadedPaymentUrl = '';

  // Admin Verification Modal State
  let isVerifyModalOpen = false;
  let targetRegForVerify: any = null;
  let verificationNotes = '';

  // Printable Exam Card Modal State
  let isCardModalOpen = false;
  let examCardData: any = null;

  async function loadData() {
    isLoading = true;
    try {
      const [myRegRes, activeSessRes] = await Promise.all([
        apiFetch('/registrations/my-registrations'),
        apiFetch('/exam-sessions/active'),
      ]);

      myRegistrations = myRegRes.data || [];
      availableSessions = activeSessRes.data || [];

      if (isAdminOrOperator) {
        let query = '';
        if (filterStatus) query = `?verificationStatus=${filterStatus}`;
        const allRegRes = await apiFetch(`/registrations${query}`);
        allRegistrations = allRegRes.data || [];
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data pendaftaran');
    } finally {
      isLoading = false;
    }
  }

  async function handleRegisterSession(sessionId: string) {
    try {
      const res = await apiFetch('/registrations', {
        method: 'POST',
        body: JSON.stringify({ examSessionId: sessionId }),
      });
      toast.success(res.message || 'Pendaftaran ujian berhasil!');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mendaftar ujian');
    }
  }

  async function handleUploadPaymentFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    isUploadingPayment = true;
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/registrations/upload-payment', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: form,
      });

      const data = await res.json();
      if (data.success) {
        uploadedPaymentUrl = data.paymentProofUrl;
        toast.success('File bukti pembayaran berhasil diunggah!');
      } else {
        toast.error(data.message || 'Gagal mengunggah bukti pembayaran');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah bukti pembayaran');
    } finally {
      isUploadingPayment = false;
    }
  }

  async function handleSavePaymentProof() {
    if (!uploadedPaymentUrl) {
      toast.error('Pilih dan unggah berkas bukti pembayaran terlebih dahulu');
      return;
    }
    try {
      toast.success('Bukti pembayaran dikirim untuk verifikasi operator');
      isPaymentModalOpen = false;
      uploadedPaymentUrl = '';
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim bukti pembayaran');
    }
  }

  async function handleAdminVerify(status: 'VERIFIED' | 'REJECTED') {
    if (!targetRegForVerify) return;
    try {
      const res = await apiFetch(`/registrations/${targetRegForVerify.id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verificationStatus: status, verificationNotes }),
      });
      toast.success(res.message || 'Status verifikasi pendaftaran berhasil diperbarui');
      isVerifyModalOpen = false;
      targetRegForVerify = null;
      verificationNotes = '';
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memverifikasi pendaftaran');
    }
  }

  async function openExamCardModal(registrationId: string) {
    try {
      const res = await apiFetch(`/registrations/${registrationId}/card`);
      examCardData = res.data;
      isCardModalOpen = true;
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat kartu ujian');
    }
  }

  function handlePrintCard() {
    window.print();
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
    loadData();
  });
</script>

<svelte:head>
  <title>Pendaftaran & Kartu Peserta | EPT UNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/50 shadow-xl text-white">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
        <UserCheck class="w-3.5 h-3.5" /> Modul Registrasi & Verifikasi Peserta
      </div>
      <h1 class="text-2xl font-extrabold tracking-tight">Pendaftaran & Cetak Kartu Peserta Ujian</h1>
      <p class="text-slate-300 text-sm mt-1">
        Pendaftaran Sesi Ujian, Upload Bukti Pembayaran, Verifikasi Berkas Operator, dan Cetak Kartu Ujian Resmi.
      </p>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
    <button
      on:click={() => (activeTab = 'myRegistrations')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap {activeTab === 'myRegistrations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Calendar class="w-4 h-4" /> Pendaftaran Ujian Saya ({myRegistrations.length})
    </button>

    {#if isAdminOrOperator}
      <button
        on:click={() => (activeTab = 'verifyOperator')}
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap {activeTab === 'verifyOperator' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
      >
        <UserCheck class="w-4 h-4" /> Verifikasi Pendaftaran Operator ({allRegistrations.length})
      </button>
    {/if}
  </div>

  <!-- Content Section -->
  {#if isLoading}
    <div class="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      <p class="text-slate-500 text-sm mt-3">Memuat pendaftaran EPTUNU...</p>
    </div>

  {:else if activeTab === 'myRegistrations'}
    <!-- MY REGISTRATIONS TAB -->
    <div class="space-y-6">
      <!-- 1. Active Available Sessions to Register -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-indigo-600" /> Sesi Ujian Aktif Yang Tersedia
        </h2>

        {#if availableSessions.length === 0}
          <p class="text-xs text-slate-500">Belum ada sesi ujian aktif yang dibuka saat ini.</p>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each availableSessions as sess}
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/30 transition-colors flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">{sess.title}</h3>
                  <div class="text-xs text-slate-600 mt-1 space-y-0.5">
                    <div>📅 {formatDate(sess.startTime)}</div>
                    <div>📍 {sess.room || 'Lab Komputer UNU Purwokerto'}</div>
                    <div>🪑 Kuota: {sess._count?.studentExams || 0} / {sess.quota} Kursi</div>
                  </div>
                </div>

                <button
                  on:click={() => handleRegisterSession(sess.id)}
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all shrink-0"
                >
                  <Plus class="w-4 h-4" /> Daftar Sesi
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- 2. Registered Student Exams Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <h2 class="text-base font-bold text-slate-800">Riwayat Pendaftaran Ujian Saya</h2>

        {#if myRegistrations.length === 0}
          <p class="text-xs text-slate-500 py-4 text-center">Anda belum terdaftar pada sesi ujian manapun.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th class="p-3.5">No. Registrasi</th>
                  <th class="p-3.5">Judul Sesi Ujian</th>
                  <th class="p-3.5">Waktu Pelaksanaan</th>
                  <th class="p-3.5 text-center">Status Verifikasi</th>
                  <th class="p-3.5 text-center">Aksi / Kartu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each myRegistrations as reg}
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="p-3.5 font-mono font-bold text-indigo-700">{reg.registrationNo || 'REG/2026/07/0001'}</td>
                    <td class="p-3.5 font-bold text-slate-900">{reg.examSession?.title}</td>
                    <td class="p-3.5 text-slate-600">{formatDate(reg.examSession?.startTime)}</td>
                    <td class="p-3.5 text-center">
                      {#if reg.verificationStatus === 'VERIFIED'}
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> Terverifikasi
                        </span>
                      {:else if reg.verificationStatus === 'REJECTED'}
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <XCircle class="w-3.5 h-3.5 text-rose-600" /> Ditolak
                        </span>
                      {:else}
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          <Clock class="w-3.5 h-3.5 text-purple-600" /> Menunggu Verifikasi
                        </span>
                      {/if}
                    </td>
                    <td class="p-3.5 text-center flex items-center justify-center gap-2">
                      <button
                        on:click={() => { targetRegForPayment = reg; isPaymentModalOpen = true; }}
                        class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
                      >
                        <CreditCard class="w-3.5 h-3.5 text-indigo-600" /> Bukti Bayar
                      </button>

                      {#if reg.verificationStatus === 'VERIFIED'}
                        <button
                          on:click={() => openExamCardModal(reg.id)}
                          class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 transition-all"
                        >
                          <Printer class="w-3.5 h-3.5" /> Cetak Kartu
                        </button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>

  {:else if activeTab === 'verifyOperator'}
    <!-- OPERATOR VERIFICATION TAB -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 class="text-base font-bold text-slate-800">Daftar Verifikasi Berkas Peserta</h2>
          <p class="text-xs text-slate-500">Periksa bukti pembayaran & keabsahan pendaftaran peserta EPTUNU.</p>
        </div>

        <div class="flex items-center gap-3">
          <select
            bind:value={filterStatus}
            on:change={loadData}
            class="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 bg-white"
          >
            <option value="">Semua Status Verifikasi</option>
            <option value="PENDING">PENDING (Menunggu)</option>
            <option value="VERIFIED">VERIFIED (Terverifikasi)</option>
            <option value="REJECTED">REJECTED (Ditolak)</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-3.5">No. Registrasi</th>
              <th class="p-3.5">Peserta</th>
              <th class="p-3.5">Sesi Ujian</th>
              <th class="p-3.5 text-center">Bukti Bayar</th>
              <th class="p-3.5 text-center">Status</th>
              <th class="p-3.5 text-center">Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each allRegistrations as reg}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-3.5 font-mono font-bold text-indigo-700">{reg.registrationNo || 'REG/2026/07/0001'}</td>
                <td class="p-3.5">
                  <div class="font-bold text-slate-900">{reg.user?.fullName}</div>
                  <div class="text-[11px] text-slate-500 font-mono">{reg.user?.identityNumber} • {reg.user?.prodi || 'Peserta'}</div>
                </td>
                <td class="p-3.5 text-slate-700 font-medium">{reg.examSession?.title}</td>
                <td class="p-3.5 text-center">
                  {#if reg.paymentProofUrl}
                    <a
                      href={reg.paymentProofUrl}
                      target="_blank"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:underline"
                    >
                      <Eye class="w-3.5 h-3.5" /> Lihat Bukti
                    </a>
                  {:else}
                    <span class="text-slate-400 italic">Belum Upload</span>
                  {/if}
                </td>
                <td class="p-3.5 text-center">
                  {#if reg.verificationStatus === 'VERIFIED'}
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">VERIFIED</span>
                  {:else if reg.verificationStatus === 'REJECTED'}
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">REJECTED</span>
                  {:else}
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">PENDING</span>
                  {/if}
                </td>
                <td class="p-3.5 text-center">
                  <button
                    on:click={() => { targetRegForVerify = reg; isVerifyModalOpen = true; }}
                    class="px-3 py-1.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-sm transition-all"
                  >
                    Verifikasi Peserta
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- UPLOAD PAYMENT PROOF MODAL -->
{#if isPaymentModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
      <div class="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <Upload class="w-5 h-5 text-indigo-400" /> Upload Bukti Pembayaran
        </div>
        <button on:click={() => (isPaymentModalOpen = false)} class="text-slate-400 hover:text-white"><X class="w-5 h-5" /></button>
      </div>

      <div class="p-6 space-y-4">
        <div class="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border">
          <div><strong>Sesi:</strong> {targetRegForPayment?.examSession?.title}</div>
          <div><strong>No. Registrasi:</strong> {targetRegForPayment?.registrationNo}</div>
        </div>

        <div>
          <label id="lbl-pay" for="in-pay" class="block text-xs font-semibold text-slate-700 mb-1">Pilih File Bukti Pembayaran (JPG/PNG/PDF)</label>
          <input
            id="in-pay"
            type="file"
            accept="image/*,application/pdf"
            on:change={handleUploadPaymentFile}
            class="w-full text-xs text-slate-500 border border-slate-300 rounded-xl p-1.5"
          />
          {#if uploadedPaymentUrl}
            <div class="text-[11px] text-emerald-600 font-mono mt-1">✓ Berkas terunggah: {uploadedPaymentUrl}</div>
          {/if}
        </div>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
        <button type="button" on:click={() => (isPaymentModalOpen = false)} class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl">Batal</button>
        <button type="button" on:click={handleSavePaymentProof} class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md">Kirim Bukti Pembayaran</button>
      </div>
    </div>
  </div>
{/if}

<!-- ADMIN VERIFICATION WORKFLOW MODAL -->
{#if isVerifyModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
      <div class="p-5 bg-gradient-to-r from-slate-900 to-purple-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <UserCheck class="w-5 h-5 text-purple-400" /> Verifikasi Pendaftaran Operator
        </div>
        <button on:click={() => (isVerifyModalOpen = false)} class="text-slate-400 hover:text-white"><X class="w-5 h-5" /></button>
      </div>

      <div class="p-6 space-y-4">
        <div class="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border space-y-1">
          <div><strong>Peserta:</strong> {targetRegForVerify?.user?.fullName} ({targetRegForVerify?.user?.identityNumber})</div>
          <div><strong>No. Registrasi:</strong> {targetRegForVerify?.registrationNo}</div>
          <div><strong>Sesi:</strong> {targetRegForVerify?.examSession?.title}</div>
        </div>

        <div>
          <label id="lbl-vnotes" for="txt-vnotes" class="block text-xs font-semibold text-slate-700 mb-1">Catatan Verifikasi (Opsional)</label>
          <textarea id="txt-vnotes" bind:value={verificationNotes} rows="2" placeholder="Catatan kelengkapan pembayaran atau alasan penolakan..." class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400"></textarea>
        </div>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button type="button" on:click={() => handleAdminVerify('REJECTED')} class="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm">❌ Tolak Berkas</button>
        <button type="button" on:click={() => handleAdminVerify('VERIFIED')} class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md">✓ Verifikasi (Terima)</button>
      </div>
    </div>
  </div>
{/if}

<!-- PRINTABLE KARTU PESERTA UJIAN MODAL -->
{#if isCardModalOpen && examCardData}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden print:shadow-none print:border-none print:w-full">
      <!-- Modal Toolbar Header (Hidden on Print) -->
      <div class="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
        <div class="flex items-center gap-2 font-bold text-sm">
          <Printer class="w-4 h-4 text-emerald-400" /> Pratinjau Kartu Peserta Ujian
        </div>
        <div class="flex items-center gap-2">
          <button on:click={handlePrintCard} class="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm">Cetak Kartu Ujian</button>
          <button on:click={() => (isCardModalOpen = false)} class="text-slate-400 hover:text-white p-1"><X class="w-5 h-5" /></button>
        </div>
      </div>

      <!-- Printable Official Card Content -->
      <div class="p-8 space-y-6 bg-white text-slate-900" id="printable-exam-card">
        <!-- Institution Header -->
        <div class="flex items-center justify-between border-b-2 border-indigo-900 pb-4">
          <div>
            <h2 class="text-base font-black tracking-wider text-indigo-950 uppercase">{examCardData.institution}</h2>
            <h3 class="text-xs font-bold text-indigo-700">{examCardData.uptName}</h3>
            <p class="text-[10px] text-slate-500 mt-0.5">Sistem Ujian Komputer TOEFL ITP (English Proficiency Test CBT)</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-xl shadow-md">
            EPT
          </div>
        </div>

        <!-- Title & Status Badge -->
        <div class="flex items-center justify-between">
          <div class="text-xs font-bold uppercase tracking-widest text-slate-500">KARTU PESERTA UJIAN RESMI</div>
          <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ STATUS: TERVERIFIKASI
          </span>
        </div>

        <!-- Student & Exam Details Table -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div class="text-[10px] text-slate-500 font-semibold uppercase">Nomor Registrasi</div>
            <div class="font-mono font-bold text-sm text-indigo-800">{examCardData.registrationNo}</div>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div class="text-[10px] text-slate-500 font-semibold uppercase">NIM / NIP Identitas</div>
            <div class="font-mono font-bold text-sm text-slate-900">{examCardData.identityNumber}</div>
          </div>

          <div class="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div class="text-[10px] text-slate-500 font-semibold uppercase">Nama Lengkap Peserta</div>
            <div class="font-black text-base text-slate-900">{examCardData.fullName}</div>
            <div class="text-[11px] text-slate-600 mt-0.5">{examCardData.prodi} • {examCardData.faculty}</div>
          </div>

          <div class="col-span-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1">
            <div class="text-[10px] text-indigo-700 font-bold uppercase">Sesi & Lokasi Ujian</div>
            <div class="font-extrabold text-sm text-indigo-950">{examCardData.sessionTitle}</div>
            <div class="text-xs text-slate-700">📅 Tanggal: <strong>{formatDate(examCardData.startTime)}</strong></div>
            <div class="text-xs text-slate-700">📍 Ruang: <strong>{examCardData.room}</strong></div>
            <div class="text-xs text-slate-700">👤 Pengawas: <strong>{examCardData.proctorName}</strong></div>
          </div>
        </div>

        <!-- Footer Verification QR Code -->
        <div class="flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
          <div>
            <div>Kartu ini dicetak resmi oleh sistem EPTUNU CBT.</div>
            <div>Wajib dibawa saat pelaksanaan ujian di ruang lab.</div>
          </div>
          <div class="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center text-slate-400 font-mono text-[9px] text-center p-1">
            <QrCode class="w-8 h-8 text-slate-700 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
