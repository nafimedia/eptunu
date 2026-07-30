<script lang="ts">
  import { setAuth } from '$stores/auth';
  import { goto } from '$app/navigation';
  import { LogIn, ShieldCheck, UserPlus, Eye, EyeOff, User, Lock } from 'lucide-svelte';

  let identityNumber = '';
  let password = '';
  let showPassword = false;
  let error = '';
  let loading = false;

  async function handleLogin() {
    error = '';
    loading = true;

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityNumber, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login gagal. Periksa NIM/NIP dan password Anda.');
      }

      setAuth(data.token, data.user);
      goto('/dashboard');
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Masuk Platform Ujian EPTUNU | UNU Purwokerto</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
  <!-- Glowing Background Orbs -->
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

  <div class="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
    <div class="w-20 h-20 bg-slate-900 border border-slate-700/80 rounded-3xl p-2.5 flex items-center justify-center mx-auto mb-4 shadow-2xl">
      <img src="/logo.png" alt="UNU Purwokerto Logo" class="w-full h-full object-contain" />
    </div>
    <h2 class="text-3xl font-extrabold text-white tracking-tight">EPTUNU CBT Platform</h2>
    <p class="mt-2 text-sm text-slate-400">English Proficiency Test - Universitas Nahdlatul Ulama Purwokerto</p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
    <div class="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6">
      {#if error}
        <div class="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 text-center font-medium">
          {error}
        </div>
      {/if}

      <form on:submit|preventDefault={handleLogin} class="space-y-5">
        <div class="space-y-1.5">
          <label for="identityNumber" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            NIM / NIP / Identity Number
          </label>
          <div class="relative">
            <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="identityNumber"
              type="text"
              bind:value={identityNumber}
              required
              placeholder="Contoh: 202601001 atau ADMIN01"
              class="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="password" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Password
          </label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              required
              placeholder="Masukkan password akun Anda"
              class="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
            />
            <button
              type="button"
              on:click={() => (showPassword = !showPassword)}
              class="absolute right-3.5 top-3 text-slate-400 hover:text-white transition p-0.5"
              title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
            >
              {#if showPassword}
                <EyeOff class="w-4 h-4" />
              {:else}
                <Eye class="w-4 h-4" />
              {/if}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-extrabold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          {#if loading}
            <span>Memproses...</span>
          {:else}
            <LogIn class="w-4 h-4" />
            <span>Masuk ke Platform Ujian</span>
          {/if}
        </button>
      </form>

      <!-- Register Link Action Box -->
      <div class="pt-5 border-t border-slate-800 text-center space-y-3">
        <p class="text-xs text-slate-400">Belum memiliki akun peserta EPT?</p>
        <a
          href="/register"
          class="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold rounded-xl text-xs border border-emerald-500/30 transition shadow-sm"
        >
          <UserPlus class="w-4 h-4" />
          <span>Daftar Akun Peserta Baru</span>
        </a>
      </div>

      <div class="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck class="w-4 h-4 text-emerald-400" />
        <span>Sistem Terenkripsi & Integritas CBT UPT Bahasa</span>
      </div>
    </div>
  </div>
</div>
