<script lang="ts">
  import type { Question } from '$types';
  import AudioPlayer from './AudioPlayer.svelte';
  import { Bookmark } from 'lucide-svelte';

  export let question: Question;
  export let index: number;
  export let total: number;
  export let currentOption: string | null = null;
  export let isFlagged: boolean = false;
  export let onSelectOption: (option: 'A' | 'B' | 'C' | 'D') => void;
  export let onToggleFlag: () => void;
</script>

<div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
  <!-- Top Section Badge & Flag Toggle -->
  <div class="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
    <div class="flex items-center gap-3">
      <span class="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-wide uppercase">
        {question.section}
      </span>
      <span class="text-xs text-slate-400">
        Soal {index + 1} dari {total}
      </span>
    </div>

    <button
      on:click={onToggleFlag}
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition duration-200 border {isFlagged ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'}"
    >
      <Bookmark class="w-4 h-4 {isFlagged ? 'fill-amber-400 text-amber-400' : ''}" />
      <span>{isFlagged ? 'Ragu-Ragu (Tandai)' : 'Tandai Ragu-Ragu'}</span>
    </button>
  </div>

  <!-- Audio Player (Listening Section) -->
  {#if question.section === 'LISTENING' && question.audioUrl}
    <AudioPlayer audioUrl={question.audioUrl} />
  {/if}

  <!-- Passage Content (Reading Section) -->
  {#if question.passage}
    <div class="p-4 bg-slate-950/80 rounded-xl border border-slate-800 mb-5 max-h-60 overflow-y-auto leading-relaxed text-sm text-slate-300">
      {#if question.passage.title}
        <h4 class="font-bold text-indigo-300 mb-2">{question.passage.title}</h4>
      {/if}
      <p class="whitespace-pre-line">{question.passage.content}</p>
    </div>
  {/if}

  <!-- Question Text -->
  <div class="text-base md:text-lg font-medium text-slate-100 mb-6 leading-relaxed">
    {question.questionText}
  </div>

  <!-- Options Grid -->
  <div class="space-y-3">
    {#each question.options as opt}
      <button
        on:click={() => onSelectOption(opt.id)}
        class="w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group {currentOption === opt.id ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500' : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'}"
      >
        <span class="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all shrink-0 mt-0.5 {currentOption === opt.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'}">
          {opt.id}
        </span>
        <span class="text-sm md:text-base pt-0.5">{opt.text}</span>
      </button>
    {/each}
  </div>
</div>
