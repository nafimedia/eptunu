<script lang="ts">
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import { Mail, ArrowLeft } from 'lucide-svelte';

  let email = '';
  let isLoading = false;

  async function handleForgot() {
    if (!email) {
      toast.error('Masukkan alamat email Anda');
      return;
    }

    isLoading = true;
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast.success('Link reset kata sandi telah dikirimkan ke email Anda.');
    } catch (err: any) {
      toast.error('Gagal mengirimkan link reset password');
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4 relative">
  <div class="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold">Lupa Kata Sandi</h1>
      <p class="text-xs text-muted-foreground">Masukkan email Anda untuk menerima instruksi reset password</p>
    </div>

    <form on:submit|preventDefault={handleForgot} class="space-y-4">
      <div class="space-y-1.5">
        <label for="email" class="text-xs font-semibold">Alamat Email</label>
        <div class="relative">
          <Mail class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="admin@starterkit.com"
            class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow-lg shadow-primary/25"
      >
        {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
      </button>
    </form>

    <div class="text-center">
      <a href="/login" class="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft class="w-3.5 h-3.5" /> Kembali ke halaman login
      </a>
    </div>
  </div>
</div>
