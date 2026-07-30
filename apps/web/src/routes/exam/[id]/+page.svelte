<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$stores/auth';
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import type { Question, StudentExamSession } from '$types';
  import QuestionCard from '$lib/components/exam/QuestionCard.svelte';
  import QuestionGrid from '$lib/components/exam/QuestionGrid.svelte';
  import AntiCheatBanner from '$lib/components/exam/AntiCheatBanner.svelte';
  import {
    Clock,
    Wifi,
    WifiOff,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Maximize2,
    Minimize2,
    Zap,
    RotateCcw
  } from 'lucide-svelte';

  const studentExamId = $page.params.id;

  let sessionData: StudentExamSession | null = null;
  let questions: Question[] = [];
  let activeIndex = 0;
  let answers: Record<string, { option: string | null; isFlagged: boolean }> = {};
  let syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE' = 'SYNCED';
  let remainingSeconds = 6600; // Default 110 minutes
  let showSubmitModal = false;
  let submitting = false;
  let violationCount = 0;
  let ws: WebSocket | null = null;

  // Features Settings
  let isAutoNext = true; // Auto Next toggle
  let isFullscreen = false;

  // Hydrate exam state from local storage or server session
  onMount(() => {
    if (!$auth.isAuthenticated) {
      goto('/login');
      return;
    }

    const storedSession = sessionStorage.getItem('currentExamSession');
    if (storedSession) {
      try {
        sessionData = JSON.parse(storedSession);
        if (sessionData) {
          questions = sessionData.questions;
          // Hydrate existing answers from backend DB
          for (const ans of sessionData.existingAnswers) {
            answers[ans.questionId] = { option: ans.selectedOption, isFlagged: ans.isFlagged };
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Hydrate local cache (Resume feature on connection loss or refresh)
    const cached = localStorage.getItem(`ept_cache_${studentExamId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        answers = { ...answers, ...parsed };
      } catch (e) { /* ignore */ }
    }

    initWebSocket();
    startClientCountdown();

    // Check Fullscreen state & Anti-cheat event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', preventDefaultAction);
    document.addEventListener('copy', preventDefaultAction);
    document.addEventListener('cut', preventDefaultAction);
  });

  function preventDefaultAction(e: Event) {
    e.preventDefault();
    toast.error('Aksi Dilarang!', { description: 'Copy-paste dan Klik Kanan dinonaktifkan demi integritas ujian EPT.' });
  }

  let lastViolationTime = 0;
  function handleVisibilityChange() {
    if (document.hidden || document.visibilityState === 'hidden') {
      registerViolation('Meninggalkan tab ujian / beralih aplikasi');
    }
  }

  function handleWindowBlur() {
    registerViolation('Fokus layar berpindah dari jendela ujian');
  }

  function registerViolation(reason: string) {
    const now = Date.now();
    if (now - lastViolationTime < 3000) return; // Throttle 3s
    lastViolationTime = now;

    violationCount++;
    toast.error(`Peringatan Pelanggaran Anti-Cheat #${violationCount}!`, {
      description: `${reason}. Maksimal 3x pelanggaran sebelum ujian otomatis di-submit.`,
      duration: 6000,
    });

    apiFetch('/exam/log-violation', {
      method: 'POST',
      body: JSON.stringify({ studentExamId, reason, count: violationCount }),
    }).catch(() => {});

    if (violationCount >= 3) {
      toast.error('Batas Maksimal Pelanggaran Terlampaui!', {
        description: 'Sistem Anti-Cheat otomatis menghentikan dan mengumpulkan lembar ujian Anda.',
      });
      submitExam(true);
    }
  }

  function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
  }

  function requestFullscreenMode() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  let countdownInterval: any;
  function startClientCountdown() {
    countdownInterval = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        if (remainingSeconds === 0) {
          submitExam(true); // Auto Submit on time expired
        }
      }
    }, 1000);
  }

  function initWebSocket() {
    if (typeof window === 'undefined') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/v1/exam/timer?examId=${studentExamId}`;

    ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'TICK' || msg.type === 'WARNING') {
          remainingSeconds = msg.remainingSeconds;
        } else if (msg.type === 'FORCE_SUBMIT') {
          submitExam(true);
        }
      } catch (e) {
        // ignore
      }
    };
  }

  function handleSelectOption(option: 'A' | 'B' | 'C' | 'D') {
    if (!questions[activeIndex]) return;
    const qId = questions[activeIndex].id;
    const isFlagged = answers[qId]?.isFlagged || false;

    answers[qId] = { option, isFlagged };
    saveToLocalStorage();
    triggerSync();

    // Feature: Auto Next if enabled
    if (isAutoNext && activeIndex < questions.length - 1) {
      setTimeout(() => {
        activeIndex++;
      }, 250);
    }
  }

  function handleToggleFlag() {
    if (!questions[activeIndex]) return;
    const qId = questions[activeIndex].id;
    const option = answers[qId]?.option || null;
    const isFlagged = !(answers[qId]?.isFlagged || false);

    answers[qId] = { option, isFlagged };
    saveToLocalStorage();
    triggerSync();
  }

  function saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ept_cache_${studentExamId}`, JSON.stringify(answers));
    }
  }

  let syncTimer: any;
  function triggerSync() {
    syncStatus = 'PENDING';
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        const payload = Object.entries(answers).map(([qId, data]) => ({
          questionId: qId,
          selectedOption: data.option,
          isFlagged: data.isFlagged,
        }));

        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/exam/sync-answers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ studentExamId, answers: payload }),
        });

        if (res.ok) {
          syncStatus = 'SYNCED';
        } else {
          syncStatus = 'OFFLINE';
        }
      } catch (e) {
        syncStatus = 'OFFLINE';
      }
    }, 1000);
  }

  async function submitExam(isAutoSubmit = false) {
    submitting = true;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/exam/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ studentExamId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.removeItem(`ept_cache_${studentExamId}`);
        sessionStorage.removeItem('currentExamSession');
        goto('/dashboard');
      }
    } catch (e) {
      // ignore
    } finally {
      submitting = false;
      showSubmitModal = false;
    }
  }

  function formatTimer(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  onDestroy(() => {
    if (ws) ws.close();
    if (countdownInterval) clearInterval(countdownInterval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', preventDefaultAction);
      document.removeEventListener('copy', preventDefaultAction);
      document.removeEventListener('cut', preventDefaultAction);
    }
  });
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
  <!-- Fullscreen Enforcement Alert Bar -->
  {#if !isFullscreen}
    <div class="bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg">
      <span class="flex items-center gap-2">
        <AlertTriangle class="w-4 h-4" /> Ujian EPT wajib dilaksanakan dalam Mode Fullscreen Layar Penuh.
      </span>
      <button
        on:click={requestFullscreenMode}
        class="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition flex items-center gap-1"
      >
        <Maximize2 class="w-3.5 h-3.5" /> Masuk Fullscreen
      </button>
    </div>
  {/if}

  <!-- Top CBT Navigation Bar -->
  <header class="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xl">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
        EPT
      </div>
      <div>
        <h1 class="text-sm md:text-base font-bold text-white leading-tight">
          {sessionData?.sessionTitle || 'EPT Regular UNU Purwokerto'}
        </h1>
        <p class="text-[11px] text-slate-400">
          Peserta: {$auth.user?.fullName} ({$auth.user?.identityNumber})
        </p>
      </div>
    </div>

    <!-- Right Controls: Sync Status, Auto Next Toggle, Timer, Submit Button -->
    <div class="flex items-center gap-3 md:gap-4">
      <!-- Auto Next Toggle -->
      <label class="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={isAutoNext}
          class="w-3.5 h-3.5 text-indigo-600 rounded"
        />
        <span class="flex items-center gap-1"><Zap class="w-3 h-3 text-amber-400" /> Auto Next</span>
      </label>

      <!-- Sync Status Badge -->
      <div class="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-800 bg-slate-950">
        {#if syncStatus === 'SYNCED'}
          <Wifi class="w-3.5 h-3.5 text-emerald-400" />
          <span class="text-emerald-400 font-medium">Tersimpan</span>
        {:else if syncStatus === 'PENDING'}
          <div class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
          <span class="text-amber-400 font-medium">Auto Saving...</span>
        {:else}
          <WifiOff class="w-3.5 h-3.5 text-red-400" />
          <span class="text-red-400 font-medium">Offline (Auto Resume)</span>
        {/if}
      </div>

      <!-- Real-time Timer -->
      <div class="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-indigo-400 font-mono text-sm font-bold shadow-inner {remainingSeconds < 300 ? 'border-red-500 text-red-400 animate-pulse' : ''}">
        <Clock class="w-4 h-4 text-indigo-400 animate-pulse" />
        <span>{formatTimer(remainingSeconds)}</span>
      </div>

      <!-- Finish Exam Button -->
      <button
        on:click={() => (showSubmitModal = true)}
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-bold rounded-xl transition shadow-lg flex items-center gap-1.5"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span>Selesai Ujian</span>
      </button>
    </div>
  </header>

  <!-- Main Content Layout -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Question View Area (Cols 1-8) -->
    <div class="lg:col-span-8 space-y-4">
      <AntiCheatBanner bind:violationCount onViolation={(c) => (violationCount = c)} />

      {#if questions.length > 0}
        <QuestionCard
          question={questions[activeIndex]}
          index={activeIndex}
          total={questions.length}
          currentOption={answers[questions[activeIndex].id]?.option || null}
          isFlagged={answers[questions[activeIndex].id]?.isFlagged || false}
          onSelectOption={handleSelectOption}
          onToggleFlag={handleToggleFlag}
        />

        <!-- Prev / Next Controls -->
        <div class="flex items-center justify-between pt-2">
          <button
            on:click={() => activeIndex = Math.max(0, activeIndex - 1)}
            disabled={activeIndex === 0}
            class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-xs font-semibold border border-slate-800 transition flex items-center gap-1.5"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <button
            on:click={() => activeIndex = Math.min(questions.length - 1, activeIndex + 1)}
            disabled={activeIndex === questions.length - 1}
            class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            <span>Berikutnya</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      {:else}
        <div class="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
          Memuat soal ujian EPTUNU...
        </div>
      {/if}
    </div>

    <!-- Question Navigation Sidebar (Cols 9-12) -->
    <div class="lg:col-span-4 space-y-4">
      <QuestionGrid
        {questions}
        {activeIndex}
        {answers}
        onSelectQuestion={(idx) => (activeIndex = idx)}
      />
    </div>
  </main>
</div>

<!-- Submit Confirmation Modal -->
{#if showSubmitModal}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white">
      <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
        <CheckCircle2 class="w-6 h-6" />
      </div>

      <h3 class="text-lg font-bold text-center text-white mb-2">Konfirmasi Selesai Ujian</h3>
      <p class="text-xs text-slate-300 text-center mb-6 leading-relaxed">
        Apakah Anda yakin ingin menyelesaikan dan mengirim jawaban ujian EPT ini?
        Jawaban yang sudah dikirim tidak dapat diubah kembali.
      </p>

      <div class="flex items-center gap-3">
        <button
          on:click={() => (showSubmitModal = false)}
          disabled={submitting}
          class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition border border-slate-700"
        >
          Batal & Periksa Lagi
        </button>

        <button
          on:click={() => submitExam(false)}
          disabled={submitting}
          class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg"
        >
          {submitting ? 'Mengirim...' : 'Ya, Kirim Ujian'}
        </button>
      </div>
    </div>
  </div>
{/if}
