<script lang="ts">
  import type { Question } from '$types';
  import AudioPlayer from './AudioPlayer.svelte';
  import { Bookmark, BookOpen } from 'lucide-svelte';

  export let question: Question;
  export let index: number;
  export let total: number;
  export let currentOption: string | null = null;
  export let isFlagged: boolean = false;
  export let onSelectOption: (option: 'A' | 'B' | 'C' | 'D') => void;
  export let onToggleFlag: () => void;

  const letterLabels = ['A', 'B', 'C', 'D'];
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl text-white">
  <!-- Top Section Badge & Flag Toggle -->
  <div class="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
    <div class="flex items-center gap-3">
      <span class="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-wide uppercase">
        {question.section}
      </span>
      <span class="text-xs text-slate-400">
        Soal <strong>{index + 1}</strong> dari <strong>{total}</strong>
      </span>
    </div>

    <button
      type="button"
      on:click={onToggleFlag}
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition duration-200 border {isFlagged ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'}"
    >
      <Bookmark class="w-4 h-4 {isFlagged ? 'fill-amber-400 text-amber-400' : ''}" />
      <span>{isFlagged ? 'Ragu-Ragu (Ditandai)' : 'Tandai Ragu-Ragu'}</span>
    </button>
  </div>

  {#if question.passage}
    <!-- SPLIT SCREEN LAYOUT FOR READING SECTION WITH PASSAGE -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column: Reading Passage Text -->
      <div class="lg:col-span-6 bg-slate-950/90 rounded-2xl border border-slate-800 p-4 sm:p-5 lg:max-h-[calc(100vh-230px)] lg:overflow-y-auto leading-relaxed text-sm text-slate-200 space-y-3 shadow-inner">
        <div class="sticky top-0 bg-slate-950/95 pb-2 border-b border-slate-800/80 flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <BookOpen class="w-3.5 h-3.5" /> Wacana Bacaan (Reading Passage)
          </span>
          <span class="text-[10px] text-slate-500">Scroll untuk membaca</span>
        </div>
        {#if question.passage.title}
          <h4 class="font-extrabold text-sm sm:text-base text-indigo-300">{question.passage.title}</h4>
        {/if}
        <div class="whitespace-pre-line text-xs sm:text-sm font-serif leading-relaxed text-slate-300 select-none space-y-2">
          {question.passage.content}
        </div>
      </div>

      <!-- Right Column: Question & Options -->
      <div class="lg:col-span-6 flex flex-col justify-between space-y-4">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            Pertanyaan Soal #{index + 1}:
          </span>
          <div class="text-sm sm:text-base font-medium text-slate-100 mb-4 leading-relaxed">
            {question.questionText}
          </div>

          <!-- Options Grid -->
          <div class="space-y-2.5">
            {#each question.options as opt, optIdx}
              {@const letterLabel = letterLabels[optIdx] || opt.id}
              <button
                type="button"
                on:click={() => onSelectOption(opt.id || letterLabel)}
                class="w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3 group {currentOption === opt.id ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500' : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'}"
              >
                <span class="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all shrink-0 mt-0.5 {currentOption === opt.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'}">
                  {letterLabel}
                </span>
                <span class="text-xs sm:text-sm pt-0.5">{opt.text}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- STANDARD LAYOUT (LISTENING & STRUCTURE) -->
    <!-- Audio Player (Listening Section) -->
    {#if question.section === 'LISTENING' && question.audioUrl}
      <AudioPlayer audioUrl={question.audioUrl} questionId={question.id} />
    {/if}

    <!-- Question Text -->
    <div class="text-base sm:text-lg font-medium text-slate-100 mb-6 leading-relaxed">
      {question.questionText}
    </div>

    <!-- Options Grid -->
    <div class="space-y-3">
      {#each question.options as opt, optIdx}
        {@const letterLabel = letterLabels[optIdx] || opt.id}
        <button
          type="button"
          on:click={() => onSelectOption(opt.id || letterLabel)}
          class="w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group {currentOption === opt.id ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500' : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'}"
        >
          <span class="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all shrink-0 mt-0.5 {currentOption === opt.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'}">
            {letterLabel}
          </span>
          <span class="text-sm sm:text-base pt-0.5">{opt.text}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
