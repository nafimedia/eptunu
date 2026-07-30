<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ShieldAlert, AlertTriangle } from 'lucide-svelte';

  export let violationCount: number = 0;
  export let onViolation: (count: number) => void;

  let showWarningModal = false;
  let currentViolationReason = '';

  function handleVisibilityChange() {
    if (document.hidden) {
      triggerViolation('Meninggalkan / beralih tab browser ujian');
    }
  }

  function handleBlur() {
    triggerViolation('Kehilangan fokus layar ujian');
  }

  function triggerViolation(reason: string) {
    violationCount += 1;
    currentViolationReason = reason;
    showWarningModal = true;
    if (onViolation) onViolation(violationCount);
  }

  function closeModal() {
    showWarningModal = false;
  }

  onMount(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    }
  });
</script>

<!-- Anti-Cheat Status Bar -->
{#if violationCount > 0}
  <div class="mb-4 p-3 bg-amber-950/80 border border-amber-800/80 rounded-xl flex items-center justify-between text-xs text-amber-200 shadow-md">
    <div class="flex items-center gap-2">
      <ShieldAlert class="w-4 h-4 text-amber-400 shrink-0" />
      <span><strong>Peringatan Anti-Cheat:</strong> Terdeteksi {violationCount}x pelanggaran fokus.</span>
    </div>
  </div>
{/if}

<!-- Warning Modal -->
{#if showWarningModal}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center text-white">
      <div class="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
        <AlertTriangle class="w-6 h-6" />
      </div>

      <h3 class="text-lg font-bold text-amber-400 mb-2">Peringatan Integritas Ujian!</h3>
      <p class="text-xs text-slate-300 mb-4 leading-relaxed">
        Sistem menguji integritas ujian dan mendeteksi: <br />
        <strong class="text-white">{currentViolationReason}</strong>.
      </p>

      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 mb-5">
        Total Pelanggaran: <strong class="text-amber-400 font-bold">{violationCount}</strong>
      </div>

      <button
        on:click={closeModal}
        class="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition"
      >
        Saya Mengerti & Kembali ke Ujian
      </button>
    </div>
  </div>
{/if}
