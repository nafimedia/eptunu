<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import {
    Settings,
    Building2,
    Sliders,
    FileCheck,
    ShieldAlert,
    Save,
    RefreshCw,
    Award,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Globe,
    Mail,
    MapPin,
    ShieldCheck,
    Table,
    Bell,
    Send,
    MessageSquare,
    Smartphone,
    HardDriveDownload,
    UploadCloud,
    Trash2,
    RefreshCcw,
    Database
  } from 'lucide-svelte';

  let isLoading = true;
  let isSaving = false;
  let isTestingNotif = false;
  let isExportingBackup = false;
  let isRestoring = false;
  let isResetting = false;
  let resetConfirmationText = '';

  let activeTab: 'institution' | 'exam' | 'certificate' | 'conversion' | 'security' | 'notifications' | 'backup' = 'institution';

  let settings = {
    institution: 'Universitas Nahdlatul Ulama Purwokerto',
    uptName: 'UPT Bahasa UNU Purwokerto',
    logoUrl: '/logo.png',
    contactEmail: 'unupurwokerto@gmail.com',
    address: 'Karangklesem, Purwokerto Selatan, Kabupaten Banyumas, Jawa Tengah 53145',
    passingScore: 450,
    maxViolations: 3,
    defaultDuration: 110,
    signerName: 'Kepala UPT Bahasa UNU Purwokerto',
    signerNip: '198504152010121002',
    signerSignatureUrl: '',
    certValidityYears: 2,
    maintenanceMode: false,

    // Notification Settings
    enableEmailNotif: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'unupurwokerto@gmail.com',
    smtpPass: 'app_password_secret',
    smtpSenderName: 'UPT Bahasa UNU Purwokerto',

    enableWaNotif: true,
    waProvider: 'Fonnte / Wablas',
    waApiKey: 'FONNTE_API_TOKEN_SAMPLE',
    waSenderNumber: '081234567890',
    waEndpointUrl: 'https://api.fonnte.com/send',
  };

  let testEmailInput = 'unupurwokerto@gmail.com';
  let testPhoneInput = '081234567890';

  let conversions: any[] = [];
  let isSavingConversions = false;

  // Signature Canvas Drawing Pad State
  let sigCanvas: HTMLCanvasElement | null = null;
  let isDrawing = false;

  function startDrawing(e: MouseEvent | TouchEvent) {
    if (!sigCanvas) return;
    isDrawing = true;
    const ctx = sigCanvas.getContext('2d');
    if (!ctx) return;
    const rect = sigCanvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }

  function draw(e: MouseEvent | TouchEvent) {
    if (!isDrawing || !sigCanvas) return;
    const ctx = sigCanvas.getContext('2d');
    if (!ctx) return;
    const rect = sigCanvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function clearSigCanvas() {
    if (!sigCanvas) return;
    const ctx = sigCanvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  }

  function applyDrawnSignature() {
    if (!sigCanvas) return;
    const dataUrl = sigCanvas.toDataURL('image/png');
    settings.signerSignatureUrl = dataUrl;
    toast.success('Tanda tangan dari canvas berhasil diterapkan!');
  }

  function handleSignatureUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran berkas tanda tangan maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          settings.signerSignatureUrl = event.target.result as string;
          toast.success('Gambar tanda tangan berhasil diunggah!');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function loadSettings() {
    isLoading = true;
    try {
      const [setRes, convRes] = await Promise.all([
        apiFetch('/settings'),
        apiFetch('/exam/conversions'),
      ]);
      if (setRes.data) settings = { ...settings, ...setRes.data };
      conversions = convRes.data || [];
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat pengaturan sistem');
    } finally {
      isLoading = false;
    }
  }

  async function saveSettings() {
    isSaving = true;
    try {
      const res = await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      toast.success(res.message || 'Pengaturan sistem berhasil disimpan!');
      if (res.data) settings = { ...settings, ...res.data };
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      isSaving = false;
    }
  }

  async function saveConversions() {
    isSavingConversions = true;
    try {
      const res = await apiFetch('/exam/conversions', {
        method: 'PUT',
        body: JSON.stringify({ conversions }),
      });
      toast.success(res.message || 'Tabel konversi nilai berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan tabel konversi');
    } finally {
      isSavingConversions = false;
    }
  }

  async function handleTestNotification() {
    isTestingNotif = true;
    try {
      const res = await apiFetch('/settings/test-notification', {
        method: 'POST',
        body: JSON.stringify({ testEmail: testEmailInput, testPhone: testPhoneInput }),
      });
      toast.success(res.message || 'Uji coba notifikasi berhasil!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menguji notifikasi');
    } finally {
      isTestingNotif = false;
    }
  }

  async function handleDownloadBackup() {
    isExportingBackup = true;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/settings/backup', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengunduh backup database');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_EPTUNU_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('File Backup Database (.JSON) berhasil diunduh!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunduh backup');
    } finally {
      isExportingBackup = false;
    }
  }

  async function handleFactoryReset() {
    if (resetConfirmationText !== 'RESET-DATABASE-EPTUNU') {
      toast.error('Harap ketik "RESET-DATABASE-EPTUNU" untuk mengonfirmasi reset data!');
      return;
    }

    if (!confirm('PERINGATAN: Tindakan ini akan menghapus seluruh data hasil ujian simulasi & sertifikat. Lanjutkan?')) return;

    isResetting = true;
    try {
      const res = await apiFetch('/settings/reset', {
        method: 'POST',
        body: JSON.stringify({ confirmationText: resetConfirmationText }),
      });
      toast.success(res.message || 'Reset data ujian berhasil!');
      resetConfirmationText = '';
    } catch (err: any) {
      toast.error(err.message || 'Gagal melakukan reset data');
    } finally {
      isResetting = false;
    }
  }

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['institution', 'exam', 'certificate', 'conversion', 'security', 'notifications'].includes(tabParam)) {
      activeTab = tabParam as any;
    }
    loadSettings();
  });
</script>

<svelte:head>
  <title>Pengaturan Sistem | EPT UNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/50 shadow-xl text-white">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
        <Settings class="w-3.5 h-3.5" /> Khusus Super Admin & Admin EPT
      </div>
      <h1 class="text-2xl font-extrabold tracking-tight">Pengaturan Sistem (System Settings)</h1>
      <p class="text-slate-300 text-sm mt-1">
        Konfigurasi identitas lembaga, parameter ujian CBT, konversi skor EPT, penandatangan sertifikat, dan keamanan server.
      </p>
    </div>

    <button
      on:click={saveSettings}
      disabled={isSaving || isLoading}
      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-medium text-sm shadow-lg shadow-emerald-600/30 transition-all duration-200"
    >
      {#if isSaving}
        <RefreshCw class="w-4 h-4 animate-spin" /> Menyimpan...
      {:else}
        <Save class="w-4 h-4" /> Simpan Pengaturan
      {/if}
    </button>
  </div>

  <!-- Tab Navigation -->
  <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
    <button
      on:click={() => (activeTab = 'institution')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'institution' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Building2 class="w-4 h-4" /> Identitas Lembaga
    </button>
    <button
      on:click={() => (activeTab = 'exam')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'exam' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Sliders class="w-4 h-4" /> Parameter Ujian CBT
    </button>
    <button
      on:click={() => (activeTab = 'certificate')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'certificate' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Award class="w-4 h-4" /> Sertifikat & Tanda Tangan
    </button>
    <button
      on:click={() => (activeTab = 'conversion')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'conversion' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Table class="w-4 h-4" /> Tabel Konversi Nilai
    </button>
    <button
      on:click={() => (activeTab = 'security')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <ShieldAlert class="w-4 h-4" /> Status Keamanan & Server
    </button>
    <button
      on:click={() => (activeTab = 'notifications')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Bell class="w-4 h-4" /> Notifikasi WA & Email
    </button>
    <button
      on:click={() => (activeTab = 'backup')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'backup' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <HardDriveDownload class="w-4 h-4" /> Backup, Restore & Reset
    </button>
  </div>

  <!-- Settings Form Body -->
  {#if isLoading}
    <div class="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      <p class="text-slate-500 text-sm mt-3">Memuat konfigurasi sistem EPTUNU...</p>
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

      <!-- TAB 1: INSTITUTION INFO -->
      {#if activeTab === 'institution'}
        <div class="space-y-4">
          <h2 class="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            <Building2 class="w-5 h-5 text-indigo-600" /> Profil & Identitas Lembaga
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label id="lbl-inst" for="in-inst" class="block text-xs font-semibold text-slate-700 mb-1">Nama Universitas / Institusi</label>
              <input
                id="in-inst"
                type="text"
                bind:value={settings.institution}
                class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label id="lbl-upt" for="in-upt" class="block text-xs font-semibold text-slate-700 mb-1">Nama UPT / Unit Bahasa</label>
              <input
                id="in-upt"
                type="text"
                bind:value={settings.uptName}
                class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label id="lbl-email" for="in-email" class="block text-xs font-semibold text-slate-700 mb-1">Email Kontak Resmi</label>
              <div class="relative">
                <Mail class="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  id="in-email"
                  type="email"
                  bind:value={settings.contactEmail}
                  class="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label id="lbl-logo" for="in-logo" class="block text-xs font-semibold text-slate-700 mb-1">URL Logo Lembaga</label>
              <input
                id="in-logo"
                type="text"
                bind:value={settings.logoUrl}
                class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label id="lbl-addr" for="in-addr" class="block text-xs font-semibold text-slate-700 mb-1">Alamat Kantor UPT Bahasa</label>
            <div class="relative">
              <MapPin class="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                id="in-addr"
                type="text"
                bind:value={settings.address}
                class="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

      <!-- TAB 2: EXAM PARAMETERS -->
      {:else if activeTab === 'exam'}
        <div class="space-y-4">
          <h2 class="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            <Sliders class="w-5 h-5 text-indigo-600" /> Parameter Ujian CBT & Passing Score
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
              <label id="lbl-pass" for="in-pass" class="block text-xs font-semibold text-indigo-900 mb-1">Passing Score Minimal (TOEFL 310-677)</label>
              <input
                id="in-pass"
                type="number"
                bind:value={settings.passingScore}
                min="310"
                max="677"
                class="w-full px-3.5 py-2.5 text-lg font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <p class="text-[11px] text-indigo-600 mt-1">Batas skor standar kelulusan EPT UNU Purwokerto.</p>
            </div>

            <div class="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
              <label id="lbl-viol" for="in-viol" class="block text-xs font-semibold text-amber-900 mb-1">Batas Pelanggaran Anti-Cheat</label>
              <input
                id="in-viol"
                type="number"
                bind:value={settings.maxViolations}
                min="1"
                max="10"
                class="w-full px-3.5 py-2.5 text-lg font-bold text-amber-700 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
              <p class="text-[11px] text-amber-600 mt-1">Jumlah tab-switching sebelum auto-submit dipicu.</p>
            </div>

            <div class="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
              <label id="lbl-dur" for="in-dur" class="block text-xs font-semibold text-blue-900 mb-1">Durasi Default Ujian (Menit)</label>
              <input
                id="in-dur"
                type="number"
                bind:value={settings.defaultDuration}
                min="30"
                max="180"
                class="w-full px-3.5 py-2.5 text-lg font-bold text-blue-700 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-[11px] text-blue-600 mt-1">Durasi alokasi waktu default (110 menit = 140 soal).</p>
            </div>
          </div>
        </div>

      <!-- TAB 3: CERTIFICATE & SIGNER -->
      {:else if activeTab === 'certificate'}
        <div class="space-y-4">
          <h2 class="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            <Award class="w-5 h-5 text-indigo-600" /> Pengaturan Sertifikat & Tanda Tangan Digital
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label id="lbl-signer" for="in-signer" class="block text-xs font-semibold text-slate-700 mb-1">Nama Jabatan / Pejabat Penandatangan</label>
              <input
                id="in-signer"
                type="text"
                bind:value={settings.signerName}
                placeholder="Kepala UPT Bahasa UNU Purwokerto"
                class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label id="lbl-nip" for="in-nip" class="block text-xs font-semibold text-slate-700 mb-1">NIP Penandatangan</label>
              <input
                id="in-nip"
                type="text"
                bind:value={settings.signerNip}
                placeholder="198504152010121002"
                class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label id="lbl-val" for="in-val" class="block text-xs font-semibold text-slate-700 mb-1">Masa Berlaku Sertifikat (Tahun)</label>
            <input
              id="in-val"
              type="number"
              bind:value={settings.certValidityYears}
              min="1"
              max="5"
              class="w-full max-w-xs px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
            />
            <p class="text-xs text-slate-500 mt-1">Masa berlaku resmi sertifikat TOEFL ITP / EPT (Standar: 2 Tahun).</p>
          </div>

          <!-- Form Pembuat Signature Kepala UPT Bahasa -->
          <div class="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-4 mt-4">
            <div class="flex items-center justify-between border-b border-indigo-200/60 pb-2">
              <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileCheck class="w-4 h-4 text-indigo-600" />
                Pembuat Tanda Tangan Digital Kepala UPT Bahasa
              </h3>
              {#if settings.signerSignatureUrl}
                <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-full">
                  Tanda Tangan Tersimpan
                </span>
              {:else}
                <span class="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold rounded-full">
                  Belum Ada Tanda Tangan
                </span>
              {/if}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Left Column: Canvas Signature Pad -->
              <div class="space-y-2">
                <span class="block text-xs font-semibold text-slate-700">1. Goreskan Tanda Tangan (Mouse / Touchscreen)</span>
                <div class="border-2 border-dashed border-indigo-200 rounded-2xl bg-white p-2 text-center relative shadow-inner">
                  <canvas
                    bind:this={sigCanvas}
                    width={400}
                    height={150}
                    on:mousedown={startDrawing}
                    on:mousemove={draw}
                    on:mouseup={stopDrawing}
                    on:mouseleave={stopDrawing}
                    on:touchstart|preventDefault={startDrawing}
                    on:touchmove|preventDefault={draw}
                    on:touchend={stopDrawing}
                    class="w-full h-36 cursor-crosshair rounded-xl touch-none bg-slate-50/50"
                  ></canvas>
                  <p class="text-[10px] text-slate-400 mt-1">Gunakan mouse atau layar sentuh untuk membuat goresan tanda tangan</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    on:click={clearSigCanvas}
                    class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    Hapus Goresan
                  </button>
                  <button
                    type="button"
                    on:click={applyDrawnSignature}
                    class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
                  >
                    Terapkan Hasil Canvas
                  </button>
                </div>
              </div>

              <!-- Right Column: Upload Image & Preview -->
              <div class="space-y-3">
                <div>
                  <label id="lbl-sigupload" for="in-sigupload" class="block text-xs font-semibold text-slate-700 mb-1">2. Atau Unggah File Gambar Tanda Tangan (PNG/JPG)</label>
                  <input
                    id="in-sigupload"
                    type="file"
                    accept="image/png, image/jpeg"
                    on:change={handleSignatureUpload}
                    class="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 w-full"
                  />
                  <p class="text-[10px] text-slate-500 mt-1">Disarankan format PNG transparan atau latar putih bersih (Max 2MB).</p>
                </div>

                <!-- Preview Area -->
                <div class="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
                  <span class="block text-[11px] font-bold text-slate-700">Pratinjau Tanda Tangan Aktif:</span>
                  <div class="h-20 flex items-center justify-center border border-slate-100 rounded-xl bg-slate-50 p-2">
                    {#if settings.signerSignatureUrl}
                      <img src={settings.signerSignatureUrl} alt="Tanda Tangan Kepala UPT Bahasa" class="max-h-16 max-w-full object-contain" />
                    {:else}
                      <span class="text-xs italic text-slate-400">Belum ada tanda tangan yang dipilih</span>
                    {/if}
                  </div>
                  {#if settings.signerSignatureUrl}
                    <button
                      type="button"
                      on:click={() => (settings.signerSignatureUrl = '')}
                      class="text-[11px] font-semibold text-rose-600 hover:underline inline-block mt-1"
                    >
                      Hapus Tanda Tangan Aktif
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- TAB 4: SCORE CONVERSION MATRIX -->
      {:else if activeTab === 'conversion'}
        <div class="space-y-4">
          <div class="flex justify-between items-center border-b pb-2">
            <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
              <Table class="w-5 h-5 text-indigo-600" /> Tabel Konversi Nilai EPT (Raw to Scaled Score)
            </h2>
            <button
              on:click={saveConversions}
              disabled={isSavingConversions}
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow transition"
            >
              {isSavingConversions ? 'Menyimpan...' : 'Simpan Tabel Konversi'}
            </button>
          </div>

          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            Mapping skor mentah (raw score) ke skor terkonversi EPT (scaled score 31-68) sesuai standar TOEFL ITP.
          </div>

          <div class="max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 text-slate-700 uppercase text-[10px] sticky top-0 border-b">
                <tr>
                  <th class="p-3">Section</th>
                  <th class="p-3 text-center">Raw Score (Jawaban Benar)</th>
                  <th class="p-3 text-center">Scaled Score EPT</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {#each conversions as conv}
                  <tr class="hover:bg-slate-50">
                    <td class="p-3 font-bold text-slate-800 uppercase">{conv.section}</td>
                    <td class="p-3 text-center font-mono font-bold">{conv.rawScore}</td>
                    <td class="p-3 text-center">
                      <input
                        type="number"
                        bind:value={conv.scaledScore}
                        min="31"
                        max="68"
                        class="w-20 px-2 py-1 border border-slate-300 rounded font-mono font-bold text-center text-indigo-600"
                      />
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

      <!-- TAB 5: SECURITY & SERVER STATUS -->
      {:else if activeTab === 'security'}
        <div class="space-y-4">
          <h2 class="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            <ShieldAlert class="w-5 h-5 text-indigo-600" /> Mode Perbaikan & Status Server
          </h2>

          <div class="p-4 rounded-2xl border transition-all duration-200 {settings.maintenanceMode ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                {#if settings.maintenanceMode}
                  <AlertTriangle class="w-6 h-6 text-amber-600" />
                {:else}
                  <CheckCircle2 class="w-6 h-6 text-emerald-600" />
                {/if}
                <div>
                  <h3 class="font-bold text-sm">Mode Maintenance (Perbaikan Sistem)</h3>
                  <p class="text-xs opacity-80">
                    {settings.maintenanceMode ? 'Aplikasi dalam mode perbaikan. Hanya Super Admin yang dapat mengakses.' : 'Sistem beroperasi normal untuk seluruh pengguna.'}
                  </p>
                </div>
              </div>

              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={settings.maintenanceMode}
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div class="font-bold text-slate-800">Koneksi Database:</div>
              <div class="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck class="w-4 h-4 text-emerald-600" /> MySQL Laragon (Port 3306) Connected
              </div>
              <div class="text-slate-500">Database: db_eptunu</div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div class="font-bold text-slate-800">Runtime Server API:</div>
              <div class="font-mono text-indigo-700 font-semibold">
                Fastify 4.x + Node.js (Port 3001)
              </div>
              <div class="text-slate-500">OpenAPI Docs: http://localhost:3001/documentation</div>
            </div>
          </div>
        </div>
      {:else if activeTab === 'notifications'}
        <!-- Notifications & Gateway Config -->
        <div class="space-y-6">
          <!-- Email SMTP Configuration -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <div class="flex items-center gap-2">
                <Mail class="w-5 h-5 text-indigo-600" />
                <h3 class="font-bold text-slate-800 text-sm">Konfigurasi Email SMTP (Nodemailer)</h3>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" bind:checked={settings.enableEmailNotif} class="w-4 h-4 text-indigo-600 rounded" />
                <span class="text-xs font-semibold text-slate-700">Aktifkan Email</span>
              </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label id="lbl-smtphost" for="in-smtphost" class="block text-xs font-semibold text-slate-700 mb-1">SMTP Host Server</label>
                <input
                  id="in-smtphost"
                  type="text"
                  bind:value={settings.smtpHost}
                  placeholder="e.g., smtp.gmail.com"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label id="lbl-smtpport" for="in-smtpport" class="block text-xs font-semibold text-slate-700 mb-1">SMTP Port</label>
                <input
                  id="in-smtpport"
                  type="number"
                  bind:value={settings.smtpPort}
                  placeholder="587 / 465"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label id="lbl-smtpuser" for="in-smtpuser" class="block text-xs font-semibold text-slate-700 mb-1">SMTP Username / Email</label>
                <input
                  id="in-smtpuser"
                  type="email"
                  bind:value={settings.smtpUser}
                  placeholder="unupurwokerto@gmail.com"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label id="lbl-smtppass" for="in-smtppass" class="block text-xs font-semibold text-slate-700 mb-1">SMTP Password / App Password</label>
                <input
                  id="in-smtppass"
                  type="password"
                  bind:value={settings.smtpPass}
                  placeholder="••••••••••••••••"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
              <div class="md:col-span-2">
                <label id="lbl-smtpsender" for="in-smtpsender" class="block text-xs font-semibold text-slate-700 mb-1">Nama Pengirim Email (Sender Name)</label>
                <input
                  id="in-smtpsender"
                  type="text"
                  bind:value={settings.smtpSenderName}
                  placeholder="e.g., UPT Bahasa UNU Purwokerto"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <!-- WhatsApp Gateway Configuration -->
          <div class="space-y-4 pt-4 border-t border-slate-100">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <div class="flex items-center gap-2">
                <Smartphone class="w-5 h-5 text-emerald-600" />
                <h3 class="font-bold text-slate-800 text-sm">Konfigurasi WhatsApp Gateway API (Fonnte / Wablas)</h3>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" bind:checked={settings.enableWaNotif} class="w-4 h-4 text-emerald-600 rounded" />
                <span class="text-xs font-semibold text-slate-700">Aktifkan WA Gateway</span>
              </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label id="lbl-waprovider" for="in-waprovider" class="block text-xs font-semibold text-slate-700 mb-1">Penyedia WA Gateway (Provider)</label>
                <input
                  id="in-waprovider"
                  type="text"
                  bind:value={settings.waProvider}
                  placeholder="e.g., Fonnte / Wablas"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label id="lbl-wasender" for="in-wasender" class="block text-xs font-semibold text-slate-700 mb-1">Nomor WA Pengirim (Sender Number)</label>
                <input
                  id="in-wasender"
                  type="text"
                  bind:value={settings.waSenderNumber}
                  placeholder="081234567890"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
              <div class="md:col-span-2">
                <label id="lbl-waapikey" for="in-waapikey" class="block text-xs font-semibold text-slate-700 mb-1">WA Gateway API Token / Key</label>
                <input
                  id="in-waapikey"
                  type="password"
                  bind:value={settings.waApiKey}
                  placeholder="Token API Fonnte / Wablas Secret"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
              <div class="md:col-span-2">
                <label id="lbl-waendpoint" for="in-waendpoint" class="block text-xs font-semibold text-slate-700 mb-1">Endpoint URL API Gateway</label>
                <input
                  id="in-waendpoint"
                  type="url"
                  bind:value={settings.waEndpointUrl}
                  placeholder="https://api.fonnte.com/send"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <!-- Test Dispatch Section -->
          <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div class="flex items-center gap-2 font-bold text-xs text-indigo-900">
              <Send class="w-4 h-4 text-indigo-600" />
              <span>Uji Coba Pengiriman Notifikasi (Live Test)</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label id="lbl-testemail" for="in-testemail" class="block text-[11px] font-medium text-slate-600 mb-1">Email Penerima Tes</label>
                <input
                  id="in-testemail"
                  type="email"
                  bind:value={testEmailInput}
                  class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label id="lbl-testphone" for="in-testphone" class="block text-[11px] font-medium text-slate-600 mb-1">No. WA Penerima Tes</label>
                <input
                  id="in-testphone"
                  type="text"
                  bind:value={testPhoneInput}
                  class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <button
              type="button"
              on:click={handleTestNotification}
              disabled={isTestingNotif}
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
            >
              <Send class="w-3.5 h-3.5" />
              <span>{isTestingNotif ? 'Mengirim Tes...' : 'Kirim Notifikasi Tes (Email & WA)'}</span>
            </button>
          </div>
        </div>
      {:else if activeTab === 'backup'}
        <!-- Backup, Restore & Reset System -->
        <div class="space-y-6">
          <!-- 1. Database Backup Card -->
          <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <HardDriveDownload class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Download Backup Database (.JSON)</h3>
                <p class="text-xs text-slate-500">Ekspor seluruh data snapshot sistem: Konfigurasi, Fakultas, Prodi, Sesi Ujian, Bank Soal, & Passage ke format JSON aman.</p>
              </div>
            </div>

            <div class="pt-2">
              <button
                type="button"
                on:click={handleDownloadBackup}
                disabled={isExportingBackup}
                class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <HardDriveDownload class="w-4 h-4" />
                <span>{isExportingBackup ? 'Memproses Backup...' : 'Download Backup Database (.JSON)'}</span>
              </button>
            </div>
          </div>

          <!-- 2. Database Restore Card -->
          <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <UploadCloud class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Restore Database dari File Snapshot Backup</h3>
                <p class="text-xs text-slate-500">Unggah berkas `Backup_EPTUNU_[Tanggal].json` untuk memulihkan konfigurasi & bank soal ke versi sebelumnya.</p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              <input type="file" accept=".json" class="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300" />
              <button
                type="button"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
              >
                <UploadCloud class="w-3.5 h-3.5" />
                <span>Restore Database</span>
              </button>
            </div>
          </div>

          <!-- 3. Factory Reset System Card -->
          <div class="p-5 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-4">
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <Trash2 class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-rose-900 text-sm">Reset Data Ujian Simulasi & Log (Factory Reset)</h3>
                <p class="text-xs text-rose-700/80 leading-relaxed">
                  Menghapus seluruh riwayat pendaftaran ujian simulasi, log jawaban peserta, sertifikat, dan log proctoring.
                  <br />
                  <strong class="text-rose-900">Catatan Aman:</strong> Data Master Fakultas (FST, FSEH, FAI), 22 Prodi, Profil PT UNU Purwokerto (061045), Bank Soal, dan Akun Admin/Pengawas <u>TIDAK AKAN terhapus</u>.
                </p>
              </div>
            </div>

            <div class="space-y-2 pt-2 border-t border-rose-200/60">
              <label id="lbl-resetconfirm" for="in-resetconfirm" class="block text-xs font-bold text-rose-900">
                Ketik <span class="font-mono bg-rose-200/80 px-2 py-0.5 rounded text-rose-950">RESET-DATABASE-EPTUNU</span> untuk konfirmasi:
              </label>
              <div class="flex flex-col sm:flex-row gap-3">
                <input
                  id="in-resetconfirm"
                  type="text"
                  bind:value={resetConfirmationText}
                  placeholder="RESET-DATABASE-EPTUNU"
                  class="flex-1 px-3 py-2 text-xs font-mono bg-white border border-rose-300 rounded-xl focus:outline-none focus:border-rose-600 text-rose-900 font-bold"
                />
                <button
                  type="button"
                  on:click={handleFactoryReset}
                  disabled={isResetting || resetConfirmationText !== 'RESET-DATABASE-EPTUNU'}
                  class="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 shrink-0"
                >
                  <RefreshCcw class="w-3.5 h-3.5" />
                  <span>{isResetting ? 'Memproses Reset...' : 'Jalankan Reset Data Ujian'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Bottom Save Action -->
      <div class="pt-4 border-t border-slate-100 flex items-center justify-end">
        <button
          on:click={saveSettings}
          disabled={isSaving || isLoading}
          class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-medium text-sm shadow-md transition-all duration-200"
        >
          <Save class="w-4 h-4" /> Simpan Perubahan Pengaturan
        </button>
      </div>

    </div>
  {/if}
</div>
