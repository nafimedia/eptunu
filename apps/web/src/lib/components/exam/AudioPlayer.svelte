<script lang="ts">
  import { Volume2, Play, Pause, AlertCircle } from 'lucide-svelte';

  export let audioUrl: string;
  export let maxPlays: number = 2;

  let audioElement: HTMLAudioElement;
  let isPlaying = false;
  let playCount = 0;
  let currentTime = 0;
  let duration = 0;

  function togglePlay() {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      isPlaying = false;
    } else {
      if (playCount >= maxPlays) return;
      audioElement.play();
      isPlaying = true;
    }
  }

  function handleTimeUpdate() {
    if (audioElement) {
      currentTime = audioElement.currentTime;
      duration = audioElement.duration || 0;
    }
  }

  function handleEnded() {
    isPlaying = false;
    playCount += 1;
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
</script>

<div class="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg text-white mb-6">
  <div class="flex items-center justify-between mb-2">
    <div class="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
      <Volume2 class="w-5 h-5" />
      <span>Audio Listening Section</span>
    </div>
    <div class="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
      Diputar: {playCount}/{maxPlays}x
    </div>
  </div>

  <audio
    bind:this={audioElement}
    src={audioUrl}
    on:timeupdate={handleTimeUpdate}
    on:ended={handleEnded}
    preload="metadata"
  ></audio>

  <div class="flex items-center gap-4 mt-3">
    <button
      on:click={togglePlay}
      disabled={playCount >= maxPlays && !isPlaying}
      class="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-full text-white transition duration-200 flex items-center justify-center shadow-md"
    >
      {#if isPlaying}
        <Pause class="w-5 h-5" />
      {:else}
        <Play class="w-5 h-5 ml-0.5" />
      {/if}
    </button>

    <div class="flex-1">
      <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
        <div
          class="bg-indigo-500 h-full transition-all duration-150"
          style="width: {duration ? (currentTime / duration) * 100 : 0}%"
        ></div>
      </div>
      <div class="flex justify-between text-xs text-slate-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  </div>

  {#if playCount >= maxPlays}
    <div class="flex items-center gap-2 text-xs text-amber-400 mt-2">
      <AlertCircle class="w-4 h-4" />
      <span>Batas pemutaran audio ({maxPlays}x) telah tercapai.</span>
    </div>
  {/if}
</div>
