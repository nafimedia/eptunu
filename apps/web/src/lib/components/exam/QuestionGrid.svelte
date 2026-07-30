<script lang="ts">
  import type { Question } from '$types';

  export let questions: Question[] = [];
  export let activeIndex: number = 0;
  export let answers: Record<string, { option: string | null; isFlagged: boolean }> = {};
  export let onSelectQuestion: (index: number) => void;

  function getButtonClass(index: number, questionId: string) {
    const isActive = index === activeIndex;
    const ans = answers[questionId];
    const isAnswered = ans && ans.option !== null;
    const isFlagged = ans && ans.isFlagged;

    let base = "w-10 h-10 rounded-lg text-sm font-semibold flex items-center justify-center transition-all duration-150 relative border ";

    if (isActive) {
      base += "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 border-indigo-400 font-bold scale-105 shadow-md ";
    }

    if (isFlagged) {
      return base + "bg-amber-500 text-white border-amber-400";
    } else if (isAnswered) {
      return base + "bg-indigo-600 text-white border-indigo-500";
    } else {
      return base + "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700";
    }
  }
</script>

<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl text-white">
  <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
    <h3 class="font-bold text-slate-200 text-sm tracking-wide">Navigasi Soal</h3>
    <span class="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700">
      Total {questions.length} Soal
    </span>
  </div>

  <!-- Legend -->
  <div class="grid grid-cols-3 gap-2 mb-4 text-xs">
    <div class="flex items-center gap-1.5 text-slate-400">
      <div class="w-3 h-3 rounded bg-indigo-600"></div>
      <span>Dijawab</span>
    </div>
    <div class="flex items-center gap-1.5 text-slate-400">
      <div class="w-3 h-3 rounded bg-amber-500"></div>
      <span>Ragu-ragu</span>
    </div>
    <div class="flex items-center gap-1.5 text-slate-400">
      <div class="w-3 h-3 rounded bg-slate-800 border border-slate-700"></div>
      <span>Belum</span>
    </div>
  </div>

  <!-- Grid Buttons -->
  <div class="grid grid-cols-5 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
    {#each questions as q, idx}
      <button
        on:click={() => onSelectQuestion(idx)}
        class={getButtonClass(idx, q.id)}
      >
        {idx + 1}
      </button>
    {/each}
  </div>
</div>
