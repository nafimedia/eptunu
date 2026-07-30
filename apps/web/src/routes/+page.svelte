<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$stores/auth';
  import {
    Sparkles,
    ArrowRight,
    Zap,
    ShieldCheck,
    CheckCircle2,
    LayoutDashboard,
    Award,
    FileCheck,
    Headphones,
    FileText,
    BookOpen,
    Search,
    GraduationCap,
    Clock,
    Lock,
    ExternalLink,
    HelpCircle,
    Mail,
    MapPin,
    Phone,
    Check,
    UserPlus
  } from 'lucide-svelte';

  let searchCertNo = '';

  function handleVerifySearch() {
    if (!searchCertNo.trim()) return;
    goto(`/verify/${encodeURIComponent(searchCertNo.trim())}`);
  }

  function navigateToApp() {
    if ($auth.isAuthenticated) {
      goto('/dashboard');
    } else {
      goto('/login');
    }
  }

  const eptSections = [
    {
      title: 'Section 1: Listening Comprehension',
      desc: 'Menguji kemampuan memahami percakapan dan dialog bahasa Inggris Lisan. Terbagi menjadi Part A (Short Conversations), Part B (Longer Conversations), dan Part C (Academic Talks) dengan Audio MP3 Streaming.',
      icon: Headphones,
      badge: '50 Soal • 35 Menit',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Section 2: Structure & Written Expression',
      desc: 'Menguji penguasaan tata bahasa (grammar) dan struktur kalimat bahasa Inggris standar dalam konteks tulisan akademik perguruan tinggi.',
      icon: FileText,
      badge: '40 Soal • 25 Menit',
      color: 'from-teal-500 to-indigo-600',
    },
    {
      title: 'Section 3: Reading Comprehension',
      desc: 'Menguji kemampuan membaca, memahami ide utama, kosa kata (vocabulary), serta inferensi wacana akademik (Reading Passages).',
      icon: BookOpen,
      badge: '50 Soal • 55 Menit',
      color: 'from-indigo-500 to-emerald-600',
    },
  ];

  const features = [
    {
      title: 'Skoring Otomatis Standar TOEFL ITP',
      desc: 'Sistem langsung mengonversi jawaban benar (raw score) ke rentang nilai EPT 310 - 677 secara real-time dan akurat.',
      icon: Zap,
    },
    {
      title: 'Pengawasan Real-Time & Anti-Cheat',
      desc: 'Dilengkapi perekaman audit log, deteksi perpindahan tab/fullscreen, dan pembatasan sesi login untuk menjaga integritas tes.',
      icon: ShieldCheck,
    },
    {
      title: 'Sertifikat Digital & QR Verification',
      desc: 'Sertifikat dapat langsung diunduh dengan nomor sertifikat unik, QR Code verifikasi online, serta Digital Hash Signature SHA-256.',
      icon: Award,
    },
    {
      title: 'Audio Streaming MP3 Presisi Tinggi',
      desc: 'Dukungan streaming audio listening dengan HTTP Range 206 partial content untuk pengalaman audio yang jernih tanpa buffering.',
      icon: Headphones,
    },
  ];

  const testSteps = [
    {
      step: '01',
      title: 'Pendaftaran & Jadwal',
      desc: 'Peserta mendaftar dan memilih periode jadwal ujian melalui portal EPTUNU.',
    },
    {
      step: '02',
      title: 'Masuk Sesi Ujian CBT',
      desc: 'Peserta menginput token ujian dinamis di laboratorium komputer atau portal tes.',
    },
    {
      step: '03',
      title: 'Pengerjaan Tes',
      desc: 'Menjawab 140 soal (Listening, Structure, Reading) dengan timer & auto-save real-time.',
    },
    {
      step: '04',
      title: 'Hasil & Sertifikat',
      desc: 'Nilai langsung keluar dan sertifikat resmi dapat langsung diunduh & diverifikasi.',
    },
  ];
</script>

<svelte:head>
  <title>EPTUNU CBT - English Proficiency Test UNU Purwokerto</title>
  <meta name="description" content="Platform Resmi English Proficiency Test (EPT) Computer-Based Test Universitas Nahdlatul Ulama Purwokerto." />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans relative overflow-hidden">
  <!-- Glowing Ambient Emerald & Gold Background Orbs -->
  <div class="absolute -top-40 -left-40 w-[700px] h-[700px] bg-emerald-600/20 rounded-full blur-[160px] pointer-events-none z-0"></div>
  <div class="absolute top-1/3 -right-40 w-[650px] h-[650px] bg-teal-600/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
  <div class="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[170px] pointer-events-none z-0"></div>

  <!-- Header / Navbar -->
  <header class="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <!-- Brand Logo -->
      <a href="/" class="flex items-center gap-3 group">
        <img src="/logo.png" alt="UNU Purwokerto Logo" class="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform" />
        <div>
          <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">EPTUNU CBT</span>
          <span class="text-[10px] px-2.5 py-0.5 ml-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider">UNU Purwokerto</span>
        </div>
      </a>

      <!-- Quick Links & CTA -->
      <div class="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
        <a href="#seksi-ujian" class="hover:text-emerald-400 transition">Seksi Ujian</a>
        <a href="#fitur" class="hover:text-emerald-400 transition">Keunggulan</a>
        <a href="#alur" class="hover:text-emerald-400 transition">Alur Ujian</a>
        <a href="/demo-test" class="text-amber-400 hover:text-amber-300 transition font-bold">Tryout Simulasi</a>
        <a href="#verifikasi" class="hover:text-emerald-400 transition">Cek Sertifikat</a>
        <a href="#kontak" class="hover:text-emerald-400 transition">UPT Bahasa</a>
      </div>

      <div class="flex items-center gap-2.5">
        {#if !$auth.isAuthenticated}
          <a
            href="/register"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all shadow-sm"
          >
            <UserPlus class="w-4 h-4" />
            <span>Daftar Akun</span>
          </a>
        {/if}
        <button
          on:click={navigateToApp}
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 border border-emerald-400/20 transition-all transform hover:-translate-y-0.5"
        >
          <GraduationCap class="w-4 h-4" />
          <span>{$auth.isAuthenticated ? 'Ke Dashboard' : 'Login Peserta'}</span>
        </button>
      </div>
    </div>
  </header>

  <!-- HERO SECTION WITH ISLAMIC STUDENT VISUAL -->
  <section class="relative z-10 pt-12 pb-20 lg:pt-20 lg:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <!-- Left Content -->
      <div class="lg:col-span-7 space-y-6">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
          <Sparkles class="w-3.5 h-3.5 text-amber-400" /> UPT Bahasa UNU Purwokerto
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          English Proficiency Test <br />
          <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            Universitas Nahdlatul Ulama Purwokerto
          </span>
        </h1>

        <p class="text-sm sm:text-base text-slate-300 leading-relaxed">
          Sistem Ujian Sertifikasi Bahasa Inggris Berbasis Komputer (CBT) Resmi UPT Bahasa UNU Purwokerto. 
          Dirancang modern dengan penilaian konversi skor TOEFL ITP otomatis, anti-cheat real-time, serta penerbitan sertifikat digital terverifikasi.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href="/register"
            class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/30 border border-emerald-400/20 transition-all transform hover:-translate-y-0.5"
          >
            <UserPlus class="w-4 h-4" />
            <span>Daftar Akun Peserta Baru</span>
          </a>
          <button
            on:click={navigateToApp}
            class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-extrabold text-sm rounded-2xl border border-slate-800 transition"
          >
            <span>Masuk Portal Ujian</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Live Quick Certificate Search Bar -->
        <div id="verifikasi" class="pt-4">
          <div class="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl max-w-lg">
            <span class="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Search class="w-3.5 h-3.5" /> Cari & Cek Keaslian Sertifikat EPT
            </span>
            <form on:submit|preventDefault={handleVerifySearch} class="flex items-center gap-2">
              <input
                type="text"
                placeholder="Masukkan Nomor Sertifikat (Contoh: EPT/UNUPWT/2026/07/0001)"
                bind:value={searchCertNo}
                class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
              >
                Cek Verifikasi
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Right Visual (Islamic Student Portrait + Glassmorphism Cards) -->
      <div class="lg:col-span-5 relative">
        <div class="relative mx-auto max-w-md">
          <!-- Glassmorphism Outer Frame -->
          <div class="relative rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl shadow-emerald-950/50 bg-gradient-to-b from-emerald-950/40 to-slate-950/80 backdrop-blur-xl">
            <img
              src="/hero_islamic_student.png"
              alt="Mahasiswa UNU Purwokerto EPT"
              class="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
            />

            <!-- Gradient Inner Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

            <div class="absolute bottom-0 inset-x-0 p-6 text-white space-y-1">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 class="w-3 h-3 text-emerald-400" /> Mahasiswa UNU Purwokerto
              </div>
              <h3 class="text-base font-extrabold">Sertifikasi EPT Terstandarisasi</h3>
              <p class="text-xs text-slate-300">Siap untuk kelulusan, wisuda, & syarat beasiswa internasional.</p>
            </div>
          </div>

          <!-- Floating Glassmorphic Badge Top Right -->
          <div class="absolute -top-4 -right-4 bg-slate-900/90 border border-emerald-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs hidden sm:flex">
            <div class="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
              <Award class="w-5 h-5" />
            </div>
            <div>
              <span class="block font-extrabold text-white">Sertifikat Resmi</span>
              <span class="text-[10px] text-slate-400">Masa Berlaku 2 Tahun</span>
            </div>
          </div>

          <!-- Floating Glassmorphic Badge Bottom Left -->
          <div class="absolute -bottom-4 -left-4 bg-slate-900/90 border border-amber-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs hidden sm:flex">
            <div class="w-9 h-9 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center font-bold">
              <Zap class="w-5 h-5" />
            </div>
            <div>
              <span class="block font-extrabold text-white">Skor 310 - 677</span>
              <span class="text-[10px] text-slate-400">TOEFL ITP Score Formula</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS OVERVIEW -->
  <section class="relative z-10 py-8 border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div class="space-y-1">
        <span class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">100%</span>
        <span class="block text-xs text-slate-400 font-medium">Penilaian CBT Otomatis</span>
      </div>
      <div class="space-y-1">
        <span class="text-2xl sm:text-3xl font-black text-amber-400 font-mono">140 Soal</span>
        <span class="block text-xs text-slate-400 font-medium">Listening, Structure, Reading</span>
      </div>
      <div class="space-y-1">
        <span class="text-2xl sm:text-3xl font-black text-teal-400 font-mono">SHA-256</span>
        <span class="block text-xs text-slate-400 font-medium">Digital Signature Hash</span>
      </div>
      <div class="space-y-1">
        <span class="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">UPT Bahasa</span>
        <span class="block text-xs text-slate-400 font-medium">Penyelenggara Resmi UNU</span>
      </div>
    </div>
  </section>

  <!-- 3 EPT TEST SECTIONS -->
  <section id="seksi-ujian" class="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16 space-y-3">
      <span class="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
        Struktur Ujian EPT
      </span>
      <h2 class="text-2xl sm:text-4xl font-extrabold text-white">3 Seksi Ujian Berstandar Akademik</h2>
      <p class="text-xs sm:text-sm text-slate-400">
        Ujian EPTUNU menguji 3 komponen utama kecakapan bahasa Inggris sesuai standar tes TOEFL ITP.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each eptSections as sec}
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 transition">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                <svelte:component this={sec.icon} class="w-6 h-6" />
              </div>
              <span class="px-3 py-1 bg-slate-950 text-emerald-400 border border-slate-800 text-[11px] font-bold rounded-full font-mono">
                {sec.badge}
              </span>
            </div>

            <h3 class="text-base font-extrabold text-white">{sec.title}</h3>
            <p class="text-xs text-slate-300 leading-relaxed">{sec.desc}</p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- KEY FEATURES SHOWCASE -->
  <section id="fitur" class="relative z-10 py-20 bg-slate-900/50 border-y border-slate-800/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <span class="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full uppercase tracking-wider">
          Keunggulan Platform
        </span>
        <h2 class="text-2xl sm:text-4xl font-extrabold text-white">Teknologi CBT Terdepan UNU Purwokerto</h2>
        <p class="text-xs sm:text-sm text-slate-400">
          Memastikan pelaksanaan ujian berjalan lancar, aman dari kecurangan, dan akurat.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each features as item}
          <div class="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div class="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
              <svelte:component this={item.icon} class="w-5 h-5" />
            </div>
            <h3 class="text-sm font-bold text-white">{item.title}</h3>
            <p class="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- TEST STEPS FLOW -->
  <section id="alur" class="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16 space-y-3">
      <span class="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
        Alur Pelaksanaan
      </span>
      <h2 class="text-2xl sm:text-4xl font-extrabold text-white">4 Langkah Mudah Mengikuti EPT</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      {#each testSteps as s}
        <div class="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 relative">
          <span class="text-3xl font-black text-emerald-500/30 font-mono block">{s.step}</span>
          <h3 class="text-sm font-bold text-white">{s.title}</h3>
          <p class="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- FOOTER SECTION -->
  <footer id="kontak" class="relative z-10 bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-xs text-slate-400">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
      <!-- Col 1: About -->
      <div class="space-y-4 md:col-span-2">
        <div class="flex items-center gap-3">
          <img src="/logo.png" alt="UNU Purwokerto Logo" class="w-10 h-10 object-contain" />
          <div>
            <span class="font-extrabold text-base text-white block">UPT BAHASA UNU PURWOKERTO</span>
            <span class="text-[11px] text-emerald-400 font-semibold">Universitas Nahdlatul Ulama Purwokerto</span>
          </div>
        </div>
        <p class="text-slate-400 leading-relaxed max-w-md">
          Unit Pelaksana Teknis (UPT) Bahasa UNU Purwokerto melayani tes kecakapan bahasa Inggris EPT, pelatihan bahasa, dan verifikasi sertifikasi resmi perguruan tinggi.
        </p>
      </div>

      <!-- Col 2: Quick Links -->
      <div class="space-y-3">
        <h4 class="font-extrabold text-white text-sm">Navigasi Utama</h4>
        <ul class="space-y-2">
          <li><a href="/login" class="hover:text-emerald-400 transition">Portal Peserta EPT</a></li>
          <li><a href="/verify/EPT-UNUPWT-2026-07-0001" class="hover:text-emerald-400 transition">Verifikasi Sertifikat Online</a></li>
          <li><a href="/register" class="hover:text-emerald-400 transition">Pendaftaran Peserta Baru</a></li>
          <li><a href="/documentation" target="_blank" class="hover:text-emerald-400 transition">API Documentation (Swagger)</a></li>
        </ul>
      </div>

      <!-- Col 3: Contact Info -->
      <div class="space-y-3">
        <h4 class="font-extrabold text-white text-sm">Kontak & Alamat</h4>
        <div class="space-y-2 text-slate-300">
          <div class="flex items-start gap-2">
            <MapPin class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Jl. Sultan Agung No. 42, Purwokerto, Jawa Tengah</span>
          </div>
          <div class="flex items-center gap-2">
            <Mail class="w-4 h-4 text-emerald-400 shrink-0" />
            <span>uptbahasa@unupurwokerto.ac.id</span>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
      <div>
        © 2026 UPT Bahasa Universitas Nahdlatul Ulama Purwokerto. All rights reserved.
      </div>
      <div class="flex items-center gap-4">
        <span>EPTUNU CBT v1.0</span>
        <span>SvelteKit 5 + Fastify</span>
      </div>
    </div>
  </footer>
</div>
