<script lang="ts">
  import { goto } from '$app/navigation';
  import { apiFetch } from '$api/client';
  import { setAuth } from '$stores/auth';
  import { toast } from 'svelte-sonner';
  import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-svelte';

  let email = 'admin@fairuzkit.com';
  let password = 'password123';
  let isLoading = false;

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Peringatan Input', { description: 'Silakan isi email dan kata sandi Anda.' });
      return;
    }

    isLoading = true;
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.token) {
        setAuth(res.token, res.user);
        toast.success('Login Berhasil!', {
          description: `Selamat datang kembali, ${res.user?.name || 'Pengguna'}!`,
        });
        goto('/dashboard');
      } else {
        toast.error('Login Gagal', { description: res.message || 'Respons autentikasi tidak valid.' });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Email atau password salah. Silakan coba lagi.';
      toast.error('Gagal Masuk Akun', {
        description: errorMsg,
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
  <!-- Glowing Background Orbs -->
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

  <div class="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
    <!-- Header -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 mb-2">
        <Sparkles class="w-6 h-6" />
      </div>
      <h1 class="text-2xl font-bold tracking-tight">Masuk ke Account</h1>
      <p class="text-xs text-muted-foreground">FairuzKit Modern - Fastify + SvelteKit 5</p>
    </div>

    <!-- Form -->
    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <div class="space-y-1.5">
        <label for="email" class="text-xs font-semibold text-foreground">Alamat Email</label>
        <div class="relative">
          <Mail class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="admin@fairuzkit.com"
            class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label for="password" class="text-xs font-semibold text-foreground">Kata Sandi</label>
          <a href="/forgot-password" class="text-xs text-primary hover:underline font-medium">Lupa Kata Sandi?</a>
        </div>
        <div class="relative">
          <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {#if isLoading}
          <span>Memproses...</span>
        {:else}
          <span>Masuk Sekarang</span>
          <ArrowRight class="w-4 h-4" />
        {/if}
      </button>
    </form>

    <!-- Account Switcher Hint -->
    <div class="p-3 rounded-xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground space-y-1">
      <div class="font-semibold text-foreground">Kredensial Demo Super Admin:</div>
      <div>Email: <code class="text-primary font-mono">admin@starterkit.com</code></div>
      <div>Password: <code class="text-primary font-mono">password123</code></div>
    </div>

    <!-- Register Link Footer -->
    <div class="text-center text-xs text-muted-foreground">
      Belum memiliki akun?
      <a href="/register" class="text-primary font-semibold hover:underline">Daftar Akun Baru</a>
    </div>
  </div>
</div>
