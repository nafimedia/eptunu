<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    CheckCircle2,
    XCircle,
    RotateCcw,
    ArrowRight,
    Headphones,
    FileText,
    BookOpen,
    Clock,
    Award,
    Zap,
    GraduationCap,
    Home,
    RefreshCw,
    AlertCircle
  } from 'lucide-svelte';

  interface DemoQuestion {
    id: string;
    section: 'LISTENING' | 'STRUCTURE' | 'READING';
    audioUrl?: string;
    text?: string;
    prompt: string;
    options: Record<string, string>;
    correctOption: string;
    explanation?: string;
  }

  let demoQuestions: DemoQuestion[] = [];
  let isLoading = true;
  let fetchError = '';

  let currentIndex = 0;
  let userAnswers: Record<string, string> = {};
  let isFinished = false;
  let score = 0;

  async function loadDemoQuestions() {
    isLoading = true;
    fetchError = '';
    try {
      const res = await fetch('/api/questions/demo-sample');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        demoQuestions = json.data;
      } else {
        fetchError = json.message || 'Belum ada bank soal terverifikasi di database.';
      }
    } catch (e: any) {
      fetchError = 'Gagal terhubung ke database bank soal.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadDemoQuestions();
  });

  function selectOption(qId: string, opt: string) {
    if (isFinished) return;
    userAnswers[qId] = opt;
    userAnswers = { ...userAnswers };
  }

  function finishDemoTest() {
    isFinished = true;
    let correctCount = 0;
    for (const q of demoQuestions) {
      if (userAnswers[q.id] === q.correctOption) {
        correctCount++;
      }
    }
    // TOEFL ITP scaled approximation formula for demo
    score = Math.round(310 + (correctCount / Math.max(demoQuestions.length, 1)) * 367);
  }

  function restartDemoTest() {
    userAnswers = {};
    isFinished = false;
    currentIndex = 0;
    score = 0;
    loadDemoQuestions();
  }
</script>

<svelte:head>
  <title>Simulasi & Demo Test EPT | UNU Purwokerto</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col justify-between">
  <!-- Header Navbar -->
  <header class="max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800 mb-6">
    <div class="flex items-center gap-3">
      <img src="/logo.png" alt="UNU Purwokerto Logo" class="w-9 h-9 object-contain" />
      <div>
        <span class="font-extrabold text-base text-white block">Simulasi / Tryout EPTUNU</span>
        <span class="text-[11px] text-emerald-400 font-semibold">Bank Soal Riil Database CBT UNU Purwokerto</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <a
        href="/"
        class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 transition flex items-center gap-1.5"
      >
        <Home class="w-4 h-4" /> Beranda
      </a>
      <a
        href="/login"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
      >
        <GraduationCap class="w-4 h-4" /> Ujian Resmi
      </a>
    </div>
  </header>

  <!-- Main Content Body -->
  <main class="max-w-4xl mx-auto w-full flex-1 space-y-6">
    {#if isLoading}
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl space-y-4">
        <RefreshCw class="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p class="text-sm font-semibold text-slate-300">Memuat bank soal riil dari database EPTUNU...</p>
        <p class="text-xs text-slate-500">Menyiapkan kombinasi soal Listening, Structure, & Reading.</p>
      </div>

    {:else if fetchError || demoQuestions.length === 0}
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-4">
        <AlertCircle class="w-10 h-10 text-amber-400 mx-auto" />
        <h2 class="text-lg font-bold text-white">Gagal Memuat Soal Database</h2>
        <p class="text-xs text-slate-400 max-w-md mx-auto">{fetchError}</p>
        <button
          type="button"
          on:click={loadDemoQuestions}
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow"
        >
          <RefreshCw class="w-4 h-4" /> Coba Lagi
        </button>
      </div>

    {:else if !isFinished}
      <!-- Question Card Box -->
      {@const q = demoQuestions[currentIndex]}
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <!-- Section Badge & Progress -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {q.section}
            </span>
            <span class="text-xs text-slate-400 font-semibold">Soal {currentIndex + 1} dari {demoQuestions.length}</span>
          </div>

          <!-- Question Grid Navigation Bar -->
          <div class="flex items-center gap-1.5 flex-wrap">
            {#each demoQuestions as item, idx}
              <button
                type="button"
                on:click={() => (currentIndex = idx)}
                class="w-7 h-7 rounded-lg text-xs font-bold transition border {idx === currentIndex ? 'bg-indigo-600 text-white border-indigo-400' : userAnswers[item.id] ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'}"
              >
                {idx + 1}
              </button>
            {/each}
          </div>
        </div>

        <!-- Question Prompt & Context -->
        <div class="space-y-3">
          {#if q.audioUrl}
            <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
              <Headphones class="w-5 h-5 text-emerald-400 shrink-0" />
              <audio controls src={q.audioUrl} class="w-full h-8"></audio>
            </div>
          {/if}

          {#if q.text}
            <div class="p-4 sm:p-5 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed font-serif whitespace-pre-line max-h-72 overflow-y-auto shadow-inner">
              <div class="text-[11px] font-sans font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5 sticky top-0 bg-slate-950/95 pb-1">
                <BookOpen class="w-3.5 h-3.5" /> Wacana Bacaan (Reading Passage)
              </div>
              {q.text}
            </div>
          {/if}

          <h3 class="text-base font-extrabold text-white pt-2">{q.prompt}</h3>
        </div>

        <!-- Options Choice Grid -->
        <div class="grid grid-cols-1 gap-3">
          {#each Object.entries(q.options) as [key, val]}
            {@const isSelected = userAnswers[q.id] === key}
            <button
              type="button"
              on:click={() => selectOption(q.id, key)}
              class="p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition flex items-start gap-3.5 {isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'}"
            >
              <span class="w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 {isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">
                {key}
              </span>
              <span class="mt-0.5 leading-snug">{val}</span>
            </button>
          {/each}
        </div>

        <!-- Card Footer Action Bar -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            on:click={() => (currentIndex = Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            class="px-4 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 transition"
          >
            Sebelumnya
          </button>

          {#if currentIndex < demoQuestions.length - 1}
            <button
              type="button"
              on:click={() => (currentIndex = Math.min(demoQuestions.length - 1, currentIndex + 1))}
              class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
            >
              <span>Selanjutnya</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          {:else}
            <button
              type="button"
              on:click={finishDemoTest}
              class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>Selesaikan Simulasi</span>
            </button>
          {/if}
        </div>
      </div>

    {:else}
      <!-- Demo Test Results View -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 text-center animate-in fade-in duration-300">
        <div class="space-y-3">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 mx-auto">
            <Award class="w-8 h-8" />
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Hasil Simulasi EPT</h2>
          <p class="text-xs text-slate-400">Estimasi Konversi Nilai TOEFL ITP berdasarkan bank soal database riil</p>
        </div>

        <!-- Score Showcase -->
        <div class="p-6 bg-slate-950 rounded-3xl border border-slate-800 max-w-sm mx-auto space-y-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimasi Skor EPT</span>
          <div class="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400 font-mono">
            {score}
          </div>
          <span class="text-[11px] text-emerald-400 font-semibold block">Skala TOEFL ITP: 310 - 677</span>
        </div>

        <!-- Answer Explanations Review List -->
        <div class="text-left space-y-4 pt-4 border-t border-slate-800">
          <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
            <BookOpen class="w-4 h-4 text-emerald-400" /> Pembahasan Soal & Kunci Jawaban
          </h3>

          <div class="space-y-3">
            {#each demoQuestions as q, idx}
              {@const isCorrect = userAnswers[q.id] === q.correctOption}
              <div class="p-4 rounded-2xl border text-xs space-y-2 {isCorrect ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/30'}">
                <div class="flex items-center justify-between font-bold">
                  <span class="text-slate-200">Soal #{idx + 1} ({q.section})</span>
                  <span class={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                    {isCorrect ? '✓ Benar' : '✗ Salah'}
                  </span>
                </div>
                <p class="text-slate-300 font-medium">{q.prompt}</p>
                <div class="text-slate-400 text-[11px]">
                  Jawaban Anda: <strong class="text-white">{userAnswers[q.id] || '-'}</strong> | Kunci Jawaban: <strong class="text-emerald-400">{q.correctOption}</strong>
                </div>
                {#if q.explanation}
                  <div class="p-2.5 bg-slate-950 rounded-xl text-[11px] text-slate-300 font-mono border border-slate-800">
                    💡 <strong>Pembahasan:</strong> {q.explanation}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- Action Bar -->
        <div class="flex flex-col sm:flex-row justify-center gap-3 pt-4">
          <button
            type="button"
            on:click={restartDemoTest}
            class="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <RotateCcw class="w-4 h-4" /> Coba Simulasi Lagi
          </button>
          <a
            href="/register"
            class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
          >
            <span>Daftar Ujian Resmi EPTUNU</span>
            <ArrowRight class="w-4 h-4" />
          </a>
        </div>
      </div>
    {/if}
  </main>
</div>
