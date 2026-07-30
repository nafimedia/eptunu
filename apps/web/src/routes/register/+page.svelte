<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch } from '$api/client';
  import { setAuth } from '$stores/auth';
  import { toast } from 'svelte-sonner';
  import {
    Sparkles,
    User,
    Mail,
    Lock,
    ArrowRight,
    Building2,
    GraduationCap,
    CreditCard,
    CheckCircle2,
    BookOpen,
    Eye,
    EyeOff
  } from 'lucide-svelte';

  let identityNumber = '';
  let fullName = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let selectedFaculty = '';
  let selectedProdi = '';

  let showPassword = false;
  let showConfirmPassword = false;

  let faculties: any[] = [];
  let studyPrograms: any[] = [];
  let filteredProdis: any[] = [];

  let isLoading = false;
  let isFetchingMaster = true;

  onMount(async () => {
    try {
      const [facRes, prodiRes] = await Promise.all([
        apiFetch('/master-data/faculties'),
        apiFetch('/master-data/study-programs'),
      ]);

      faculties = facRes.data || [];
      studyPrograms = prodiRes.data || [];
    } catch (e) {
      // fallback
    } finally {
      isFetchingMaster = false;
    }
  });

  $: {
    if (selectedFaculty) {
      const facObj = faculties.find(
        (f) => f.name === selectedFaculty || f.code === selectedFaculty
      );
      if (facObj && facObj.studyPrograms) {
        filteredProdis = facObj.studyPrograms;
      } else {
        filteredProdis = studyPrograms.filter(
          (p) =>
            p.faculty?.name === selectedFaculty || p.faculty?.code === selectedFaculty
        );
      }
    } else {
      filteredProdis = studyPrograms;
    }
  }

  async function handleRegister() {
    if (!identityNumber.trim() || !fullName.trim() || !email.trim() || !password) {
      toast.error('Peringatan Input', { description: 'Kolom NIM/ID, Nama, Email, dan Password wajib diisi.' });
      return;
    }

    if (password.length < 6) {
      toast.error('Kata Sandi Terlalu Pendek', { description: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi Kata Sandi Salah', { description: 'Kata sandi dan konfirmasi kata sandi tidak cocok.' });
      return;
    }

    isLoading = true;
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          identityNumber: identityNumber.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          faculty: selectedFaculty || null,
          prodi: selectedProdi || null,
        }),
      });

      if (res.token && res.user) {
        setAuth(res.user, res.token);
        toast.success('Pendaftaran Berhasil! 🎉', {
          description: `Selamat datang ${res.user.fullName}. Anda telah terdaftar sebagai Peserta Ujian EPT.`,
        });
        goto('/dashboard');
      } else {
        toast.success('Pendaftaran Akun Berhasil!', {
          description: 'Akun Anda berhasil dibuat. Silakan masuk sekarang.',
        });
        goto('/login');
      }
    } catch (err: any) {
      toast.error('Pendaftaran Gagal', {
        description: err.message || 'Gagal mendaftar. Silakan periksa kembali data Anda.',
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Pendaftaran Akun Peserta EPT | UNU Purwokerto</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
  <!-- Glowing Background Orbs -->
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

  <div class="w-full max-w-xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 my-8 z-10">
    <!-- Header -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-1">
        <GraduationCap class="w-3.5 h-3.5" /> Portal Pendaftaran Mahasiswa / Peserta EPT
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
        Buat Akun Peserta EPTUNU
      </h1>
      <p class="text-xs sm:text-sm text-slate-400">
        Lengkapi formulir pendaftaran di bawah ini untuk dapat mengikuti ujian TOEFL ITP di UNU Purwokerto.
      </p>
    </div>

    <!-- Registration Form -->
    <form on:submit|preventDefault={handleRegister} class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- NIM / NIP -->
        <div class="space-y-1.5">
          <label for="identityNumber" class="text-xs font-semibold text-slate-300">NIM / NIP / No. Identitas *</label>
          <div class="relative">
            <CreditCard class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="identityNumber"
              type="text"
              bind:value={identityNumber}
              placeholder="Contoh: 202601001"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
              required
            />
          </div>
        </div>

        <!-- Nama Lengkap -->
        <div class="space-y-1.5">
          <label for="fullName" class="text-xs font-semibold text-slate-300">Nama Lengkap *</label>
          <div class="relative">
            <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="fullName"
              type="text"
              bind:value={fullName}
              placeholder="Contoh: Ahmad Fauzi"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
              required
            />
          </div>
        </div>
      </div>

      <!-- Email -->
      <div class="space-y-1.5">
        <label for="email" class="text-xs font-semibold text-slate-300">Alamat Email Aktif *</label>
        <div class="relative">
          <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="peserta@student.unupurwokerto.ac.id"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
            required
          />
        </div>
      </div>

      <!-- Fakultas & Prodi Selection -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label for="faculty" class="text-xs font-semibold text-slate-300">Fakultas</label>
          <div class="relative">
            <Building2 class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <select
              id="faculty"
              bind:value={selectedFaculty}
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition appearance-none"
            >
              <option value="" class="bg-slate-900 text-white">-- Pilih Fakultas --</option>
              {#each faculties as f}
                <option value={f.name} class="bg-slate-900 text-white">{f.name} ({f.code})</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="prodi" class="text-xs font-semibold text-slate-300">Program Studi</label>
          <div class="relative">
            <BookOpen class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <select
              id="prodi"
              bind:value={selectedProdi}
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition appearance-none"
            >
              <option value="" class="bg-slate-900 text-white">-- Pilih Program Studi --</option>
              {#each filteredProdis as p}
                <option value={p.name} class="bg-slate-900 text-white">{p.name} ({p.code})</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <!-- Password & Confirm Password -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label for="password" class="text-xs font-semibold text-slate-300">Kata Sandi (min 6 karakter) *</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              placeholder="••••••••"
              class="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
              required
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

        <div class="space-y-1.5">
          <label for="confirmPassword" class="text-xs font-semibold text-slate-300">Konfirmasi Kata Sandi *</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              bind:value={confirmPassword}
              placeholder="••••••••"
              class="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
              required
            />
            <button
              type="button"
              on:click={() => (showConfirmPassword = !showConfirmPassword)}
              class="absolute right-3.5 top-3 text-slate-400 hover:text-white transition p-0.5"
              title={showConfirmPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
            >
              {#if showConfirmPassword}
                <EyeOff class="w-4 h-4" />
              {:else}
                <Eye class="w-4 h-4" />
              {/if}
            </button>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2"
      >
        {#if isLoading}
          <span>Memproses Pendaftaran...</span>
        {:else}
          <span>Daftar Akun Peserta EPT</span>
          <ArrowRight class="w-4 h-4" />
        {/if}
      </button>
    </form>

    <!-- Footer Links -->
    <div class="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
      Sudah memiliki akun peserta?
      <a href="/login" class="text-indigo-400 font-bold hover:underline">Masuk ke Ruang Ujian</a>
    </div>
  </div>
</div>
