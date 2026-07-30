<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { auth, setAuth } from '$stores/auth';
  import { toast } from 'svelte-sonner';
  import { User, Mail, Shield, KeyRound, Save, Lock, Sparkles, CheckCircle2, Calendar, Camera, Upload } from 'lucide-svelte';

  let name = '';
  let email = '';
  let role = '';
  let avatarUrl = '';
  let permissions: string[] = [];
  let createdAt = '';

  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';

  let isUpdatingProfile = false;
  let isChangingPassword = false;
  let isUploadingAvatar = false;
  let fileInput: HTMLInputElement;

  onMount(async () => {
    try {
      const res = await apiFetch('/auth/me');
      if (res.success && res.user) {
        name = res.user.name || '';
        email = res.user.email || '';
        role = res.user.role || '';
        avatarUrl = res.user.avatarUrl || '';
        permissions = res.user.permissions || [];
        createdAt = res.user.createdAt ? new Date(res.user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
      }
    } catch (err: any) {
      toast.error('Gagal memuat profil', { description: err.message });
    }
  });

  async function handleAvatarUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran File Terlalu Besar', { description: 'Ukuran foto maksimal adalah 5MB.' });
      return;
    }

    isUploadingAvatar = true;
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.url) {
        avatarUrl = result.url;
        await handleUpdateProfile();
        toast.success('Foto Profil Berhasil Diunggah! 📸', {
          description: 'Foto avatar baru Anda telah berhasil disimpan.',
        });
      } else {
        toast.error('Gagal Unggah Foto', { description: result.message || 'Format file tidak didukung.' });
      }
    } catch (err: any) {
      toast.error('Gagal Unggah Foto', { description: err.message });
    } finally {
      isUploadingAvatar = false;
      if (fileInput) fileInput.value = '';
    }
  }

  async function handleUpdateProfile() {
    if (!name || name.trim() === '') {
      toast.error('Peringatan', { description: 'Nama tidak boleh kosong.' });
      return;
    }

    isUpdatingProfile = true;
    try {
      const res = await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, avatarUrl }),
      });

      if (res.success) {
        if ($auth.user) {
          setAuth(localStorage.getItem('token') || '', {
            ...$auth.user,
            name: res.user.name,
            avatarUrl: res.user.avatarUrl,
          });
        }
        toast.success('Profil Diperbarui! 🎉', {
          description: 'Perubahan nama dan avatar Anda berhasil disimpan.',
        });
      }
    } catch (err: any) {
      toast.error('Gagal Memperbarui Profil', { description: err.message });
    } finally {
      isUpdatingProfile = false;
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error('Peringatan', { description: 'Silakan isi password saat ini dan password baru.' });
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password Terlalu Pendek', { description: 'Password baru minimal harus 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password Tidak Cocok', { description: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    isChangingPassword = true;
    try {
      const res = await apiFetch('/users/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.success) {
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
        toast.success('Password Berhasil Diubah! 🔒', {
          description: 'Silakan gunakan password baru pada login berikutnya.',
        });
      }
    } catch (err: any) {
      toast.error('Gagal Mengubah Password', { description: err.message || 'Password saat ini salah.' });
    } finally {
      isChangingPassword = false;
    }
  }
</script>

<svelte:head>
  <title>Profil Saya - Modern FairuzKit</title>
</svelte:head>

<div class="space-y-8 max-w-5xl mx-auto">
  <!-- Page Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Pengaturan Profil</h1>
      <p class="text-sm text-muted-foreground">Kelola informasi pribadi, foto avatar, dan keamanan kata sandi Anda.</p>
    </div>
  </div>

  <!-- Profile Card Banner -->
  <div class="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
    <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

    <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
      <!-- Hidden File Input for Avatar Upload -->
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        bind:this={fileInput}
        on:change={handleAvatarUpload}
        class="hidden"
      />

      <!-- Avatar Display & Interactive Camera Button Overlay -->
      <button
        type="button"
        aria-label="Unggah foto profil"
        class="relative group cursor-pointer border-0 p-0 bg-transparent text-left font-normal"
        on:click={() => fileInput?.click()}
      >
        {#if avatarUrl}
          <img src={avatarUrl} alt={name} class="w-24 h-24 rounded-2xl object-cover border-2 border-primary shadow-md group-hover:opacity-80 transition-opacity" />
        {:else}
          <div class="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/20 group-hover:opacity-80 transition-opacity">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
        {/if}

        <div class="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {#if isUploadingAvatar}
            <span class="text-xs text-white font-medium">Unggah...</span>
          {:else}
            <Camera class="w-7 h-7 text-white drop-shadow-md" />
          {/if}
        </div>

        <div class="absolute -bottom-2 -right-2 p-2 bg-primary text-primary-foreground rounded-xl shadow-lg border-2 border-card hover:scale-105 transition-transform flex items-center justify-center">
          <Camera class="w-4 h-4" />
        </div>
      </button>

      <!-- User Details Summary -->
      <div class="space-y-2 text-center sm:text-left flex-1">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <h2 class="text-xl font-bold">{name || 'Loading...'}</h2>
          <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 w-fit mx-auto sm:mx-0">
            <Shield class="w-3.5 h-3.5" />
            {role || 'USER'}
          </span>
        </div>
        <p class="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
          <Mail class="w-4 h-4 text-muted-foreground" />
          {email}
        </p>
        {#if createdAt}
          <p class="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 pt-1">
            <Calendar class="w-3.5 h-3.5" />
            Terdaftar sejak {createdAt}
          </p>
        {/if}
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Form 1: Informasional & Avatar Profile -->
    <div class="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div class="flex items-center gap-3 border-b border-border pb-4">
        <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
          <User class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-semibold text-base">Informasi Diri</h3>
          <p class="text-xs text-muted-foreground">Perbarui nama lengkap dan URL foto profil Anda.</p>
        </div>
      </div>

      <form on:submit|preventDefault={handleUpdateProfile} class="space-y-4">
        <div class="space-y-1.5">
          <label for="profileName" class="text-xs font-semibold">Nama Lengkap</label>
          <input
            id="profileName"
            type="text"
            bind:value={name}
            class="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div class="space-y-1.5">
          <label for="profileEmail" class="text-xs font-semibold">Alamat Email (Non-Editable)</label>
          <input
            id="profileEmail"
            type="email"
            value={email}
            disabled
            class="w-full px-4 py-2.5 bg-muted/50 border border-border/60 rounded-xl text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label for="avatarUrl" class="text-xs font-semibold">URL Foto Avatar</label>
            <button
              type="button"
              on:click={() => fileInput?.click()}
              class="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              <Upload class="w-3.5 h-3.5" /> Unggah File Lokal
            </button>
          </div>
          <input
            id="avatarUrl"
            type="url"
            bind:value={avatarUrl}
            placeholder="https://example.com/avatar.jpg"
            class="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isUpdatingProfile}
          class="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save class="w-4 h-4" />
          <span>{isUpdatingProfile ? 'Simpan...' : 'Simpan Perubahan Profil'}</span>
        </button>
      </form>
    </div>

    <!-- Form 2: Keamanan Kata Sandi (Argon2id) -->
    <div class="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div class="flex items-center gap-3 border-b border-border pb-4">
        <div class="p-2 rounded-xl bg-purple-500/10 text-purple-500">
          <KeyRound class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-semibold text-base">Ubah Kata Sandi</h3>
          <p class="text-xs text-muted-foreground">Amankan akun Anda dengan kata sandi Argon2id baru.</p>
        </div>
      </div>

      <form on:submit|preventDefault={handleChangePassword} class="space-y-4">
        <div class="space-y-1.5">
          <label for="currentPassword" class="text-xs font-semibold">Kata Sandi Saat Ini</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              id="currentPassword"
              type="password"
              bind:value={currentPassword}
              placeholder="••••••••"
              class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="newPassword" class="text-xs font-semibold">Kata Sandi Baru (Min. 6 Karakter)</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              id="newPassword"
              type="password"
              bind:value={newPassword}
              placeholder="••••••••"
              class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="confirmPassword" class="text-xs font-semibold">Konfirmasi Kata Sandi Baru</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              placeholder="••••••••"
              class="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isChangingPassword}
          class="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Lock class="w-4 h-4" />
          <span>{isChangingPassword ? 'Memproses...' : 'Ubah Password Sekarang'}</span>
        </button>
      </form>
    </div>
  </div>

  <!-- Role Permissions Active Overview -->
  <div class="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
    <div class="flex items-center gap-2">
      <Sparkles class="w-5 h-5 text-indigo-500" />
      <h3 class="font-semibold text-base">Hak Akses Matriks Role ({role})</h3>
    </div>
    <div class="flex flex-wrap gap-2 pt-1">
      {#if permissions.length === 0}
        <span class="text-xs text-muted-foreground">Tidak ada hak akses terdaftar.</span>
      {:else}
        {#each permissions as perm}
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-muted text-foreground border border-border/60">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
            {perm}
          </span>
        {/each}
      {/if}
    </div>
  </div>
</div>
