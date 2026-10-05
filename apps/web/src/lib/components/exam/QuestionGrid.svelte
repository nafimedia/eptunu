<script lang="ts">
  import type { Question } from '$types';
  import { Bookmark, Check } from 'lucide-svelte';

  export let questions: Question[] = [];
  export let activeIndex: number = 0;
  export let answers: Record<string, { option: string | null; isFlagged: boolean }> = {};
  export let onSelectQuestion: (index: number) => void;

  type SectionFilter = 'ALL' | 'LISTENING' | 'STRUCTURE' | 'READING';
  let activeFilter: SectionFilter = 'ALL';

  $: listeningQuestions = questions.filter(q => q.section === 'LISTENING');
  $: structureQuestions = questions.filter(q => q.section === 'STRUCTURE');
  $: readingQuestions = questions.filter(q => q.section === 'READING');

  // Filtered list with original index preserved
  $: filteredItems = questions.map((q, idx) => ({ q, idx })).filter(item => {
    if (activeFilter === 'ALL') return true;
    return item.q.section === activeFilter;
  });

  $: totalAnswered = questions.filter(q => answers[q.id]?.option !== null && answers[q.id]?.option !== undefined).length;
  $: totalFlagged = questions.filter(q => answers[q.id]?.isFlagged).length;
  $: totalUnanswered = questions.length - totalAnswered;

  function getButtonState(questionId: string) {
    const ans = answers[questionId];
    const isAnswered = ans && ans.option !== null && ans.option !== undefined;
    const isFlagged = ans && ans.isFlagged;

    return { isAnswered, isFlagged };
  }
</script>

<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl text-white space-y-4">
  <div class="flex items-center justify-between border-b border-slate-800 pb-3">
    <h3 class="font-bold text-slate-200 text-sm tracking-wide">Navigasi Soal</h3>
    <span class="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
      {totalAnswered}/{questions.length} Terjawab
    </span>
  </div>

  <!-- Section Filter Tabs -->
  <div class="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-bold">
    <button
      type="button"
      on:click={() => (activeFilter = 'ALL')}
      class="py-1.5 rounded-lg transition text-center {activeFilter === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
    >
      Semua ({questions.length})
    </button>
    <button
      type="button"
      on:click={() => (activeFilter = 'LISTENING')}
      class="py-1.5 rounded-lg transition text-center {activeFilter === 'LISTENING' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
    >
      List. ({listeningQuestions.length})
    </button>
    <button
      type="button"
      on:click={() => (activeFilter = 'STRUCTURE')}
      class="py-1.5 rounded-lg transition text-center {activeFilter === 'STRUCTURE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
    >
      Struct. ({structureQuestions.length})
    </button>
    <button
      type="button"
      on:click={() => (activeFilter = 'READING')}
      class="py-1.5 rounded-lg transition text-center {activeFilter === 'READING' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
    >
      Read. ({readingQuestions.length})
    </button>
  </div>

  <!-- Legend -->
  <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
    <div class="flex items-center gap-1.5 text-slate-300">
      <div class="w-3.5 h-3.5 rounded bg-emerald-600 flex items-center justify-center text-[8px] text-white font-black">✓</div>
      <span>Sudah Dijawab ({totalAnswered})</span>
    </div>
    <div class="flex items-center gap-1.5 text-slate-300">
      <div class="w-3.5 h-3.5 rounded bg-amber-500 flex items-center justify-center text-[9px] text-slate-950 font-black">★</div>
      <span>Ragu-Ragu ({totalFlagged})</span>
    </div>
    <div class="flex items-center gap-1.5 text-slate-400">
      <div class="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></div>
      <span>Belum Dijawab ({totalUnanswered})</span>
    </div>
    <div class="flex items-center gap-1.5 text-slate-300">
      <div class="w-3.5 h-3.5 rounded bg-slate-800 border-2 border-indigo-400"></div>
      <span>Sedang Aktif</span>
    </div>
  </div>

  <!-- Grid Buttons -->
  <div class="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
    {#each filteredItems as item}
      {@const { isAnswered, isFlagged } = getButtonState(item.q.id)}
      {@const isActive = item.idx === activeIndex}

      <button
        type="button"
        on:click={() => onSelectQuestion(item.idx)}
        class="w-full aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all duration-150 relative border
          {isActive ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10' : ''}
          {isFlagged ? (isAnswered ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-amber-950/60 text-amber-300 border-2 border-dashed border-amber-500') : (isAnswered ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white')}"
        title="Soal #{item.idx + 1} ({item.q.section}) - {isAnswered ? 'Sudah dijawab' : 'Belum dijawab'}{isFlagged ? ' (Ragu-ragu)' : ''}"
      >
        <span>{item.idx + 1}</span>
        {#if isFlagged}
          <span class="text-[8px] leading-none absolute top-1 right-1 font-mono">★</span>
        {/if}
      </button>
    {/each}
  </div>
</div>
