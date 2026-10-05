<script lang="ts">
  import { Volume2, Play, Pause, AlertCircle } from 'lucide-svelte';

  export let audioUrl: string;
  export let questionId: string = '';
  export let maxPlays: number = 1;

  let audioElement: HTMLAudioElement;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let audioError = '';

  function getStoredPlayCount(qId: string, url: string): number {
    if (typeof window === 'undefined') return 0;
    const key = `ept_audio_${qId || url}`;
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  }

  let playCount = 0;

  $: if (questionId || audioUrl) {
    playCount = getStoredPlayCount(questionId, audioUrl);
    isPlaying = false;
    currentTime = 0;
    audioError = '';
  }

  function togglePlay() {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      isPlaying = false;
    } else {
      if (playCount >= maxPlays) return;
      audioError = '';
      audioElement.play()
        .then(() => {
          isPlaying = true;
          // Mark as played to prevent refresh-abuse
          if (playCount === 0) {
            playCount = 1;
            if (typeof window !== 'undefined') {
              const key = `ept_audio_${questionId || audioUrl}`;
              localStorage.setItem(key, '1');
            }
          }
        })
        .catch((err) => {
          isPlaying = false;
          audioError = 'Gagal memutar berkas audio. Pastikan perangkat audio/headset Anda terhubung.';
        });
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
  }

  function handleAudioError() {
    isPlaying = false;
    audioError = 'Audio tidak dapat dimuat dari server streaming. Silakan hubungi pengawas.';
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
</script>

<div class="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg text-white mb-6">
  <div class="flex items-center justify-between mb-2">
    <div class="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
      <Volume2 class="w-5 h-5" />
      <span>Audio Listening Section</span>
    </div>
    <div class="text-xs px-2.5 py-1 rounded-full border {playCount >= maxPlays ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}">
      Status Pemutaran: {playCount}/{maxPlays}x
    </div>
  </div>

  {#if audioError}
    <div class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 my-2">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{audioError}</span>
    </div>
  {/if}

  <audio
    bind:this={audioElement}
    src={audioUrl}
    on:timeupdate={handleTimeUpdate}
    on:ended={handleEnded}
    on:error={handleAudioError}
    preload="metadata"
  ></audio>

  <div class="flex items-center gap-4 mt-3">
    <button
      type="button"
      on:click={togglePlay}
      disabled={playCount >= maxPlays && !isPlaying}
      class="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-full text-white transition duration-200 flex items-center justify-center shadow-md cursor-pointer disabled:cursor-not-allowed"
      title={playCount >= maxPlays && !isPlaying ? 'Audio sudah diputar (maksimal 1x)' : (isPlaying ? 'Jeda Audio' : 'Putar Audio')}
    >
      {#if isPlaying}
        <Pause class="w-5 h-5" />
      {:else}
        <Play class="w-5 h-5 ml-0.5" />
      {/if}
    </button>

    <div class="flex-1">
      <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-1.5">
        <div
          class="bg-indigo-500 h-full transition-all duration-150"
          style="width: {duration ? (currentTime / duration) * 100 : 0}%"
        ></div>
      </div>
      <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{duration ? formatTime(duration) : '--:--'}</span>
      </div>
    </div>
  </div>

  {#if playCount >= maxPlays && !isPlaying}
    <p class="text-[11px] text-slate-400 mt-2 text-center italic">
      Sesuai instruksi ujian, rekaman percakapan audio hanya diperdengarkan 1 kali.
    </p>
  {/if}
</div>
