<script lang="ts">
  import { ShieldAlert, AlertTriangle } from 'lucide-svelte';

  export let violationCount: number = 0;
  export let maxViolations: number = 3;
  export let showWarningModal: boolean = false;
  export let currentViolationReason: string = '';
  export let onCloseModal: () => void = () => {};

  $: remainingChances = Math.max(0, maxViolations - violationCount);
</script>

<!-- Anti-Cheat Status Bar -->
{#if violationCount > 0}
  <div class="mb-4 p-3 bg-amber-950/80 border border-amber-800/80 rounded-xl flex items-center justify-between text-xs text-amber-200 shadow-md">
    <div class="flex items-center gap-2">
      <ShieldAlert class="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        <strong>Peringatan Integritas:</strong> Terdeteksi {violationCount} dari maksimal {maxViolations} pelanggaran.
        (Tersisa {remainingChances} kesempatan).
      </span>
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

      <h3 class="text-lg font-bold text-amber-400 mb-1">Peringatan Integritas Ujian!</h3>
      <p class="text-xs text-slate-300 mb-4 leading-relaxed">
        Sistem mendeteksi aktivitas di luar aplikasi ujian: <br />
        <strong class="text-white bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">{currentViolationReason || 'Beralih jendela / tab browser'}</strong>
      </p>

      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 mb-5 space-y-1">
        <div>
          Pelanggaran ke: <strong class="text-amber-400 font-bold">{violationCount} / {maxViolations}</strong>
        </div>
        {#if remainingChances > 0}
          <div class="text-[11px] text-slate-400">
            Perhatian: Anda memiliki <strong class="text-amber-300">{remainingChances} kesempatan</strong> lagi sebelum ujian otomatis dihentikan dan dikumpulkan.
          </div>
        {:else}
          <div class="text-rose-400 font-bold">
            Batas pelanggaran telah tercapai. Ujian akan otomatis dikumpulkan.
          </div>
        {/if}
      </div>

      <button
        type="button"
        on:click={onCloseModal}
        class="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-md"
      >
        Saya Mengerti & Kembali ke Lembar Ujian
      </button>
    </div>
  </div>
{/if}
