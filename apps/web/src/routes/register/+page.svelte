<script lang="ts">
  import { goto } from '$app/navigation';
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import { Sparkles, User, Mail, Lock, ArrowRight } from 'lucide-svelte';

  let name = '';
  let email = '';
  let password = '';
  let isLoading = false;

  async function handleRegister() {
    if (!name || !email || !password) {
      toast.error('Peringatan Input', { description: 'Semua kolom pendaftaran wajib diisi.' });
      return;
    }

    if (password.length < 6) {
      toast.error('Kata Sandi Terlalu Pendek', { description: 'Kata sandi minimal harus 6 karakter.' });
      return;
    }

    isLoading = true;
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      toast.success('Pendaftaran Akun Berhasil! 🎉', {
        description: 'Akun Anda berhasil dibuat. Silakan login sekarang.',
        duration: 5000,
      });
      goto('/login');
    } catch (err: any) {
      const errorMsg = err.message || 'Gagal mendaftar. Silakan coba lagi.';
      toast.error('Pendaftaran Gagal', {
        description: errorMsg,
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

  <div class="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 mb-2">
        <Sparkles class="w-6 h-6" />
      </div>
      <h1 class="text-2xl font-bold tracking-tight">Buat Akun Baru</h1>
      <p class="text-xs text-muted-foreground">Bergabunglah dengan ekosistem FairuzKit</p>
    </div>

    <form on:submit|preventDefault={handleRegister} class="space-y-4">
      <div class="space-y-1.5">
        <label for="name" class="text-xs font-semibold">Nama Lengkap</label>
        <div class="relative">
          <User class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="John Doe"
            class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label for="email" class="text-xs font-semibold">Alamat Email</label>
        <div class="relative">
          <Mail class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="user@example.com"
            class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label for="password" class="text-xs font-semibold">Kata Sandi</label>
        <div class="relative">
          <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
      >
        {#if isLoading}
          <span>Membuat Akun...</span>
        {:else}
          <span>Daftar Sekarang</span>
          <ArrowRight class="w-4 h-4" />
        {/if}
      </button>
    </form>

    <div class="text-center text-xs text-muted-foreground">
      Sudah memiliki akun?
      <a href="/login" class="text-primary font-semibold hover:underline">Masuk ke Akun</a>
    </div>
  </div>
</div>
