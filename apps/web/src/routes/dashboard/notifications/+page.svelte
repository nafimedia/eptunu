<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import type { Notification } from '$types';
  import { toast } from 'svelte-sonner';
  import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, Clock } from 'lucide-svelte';

  let notifications: Notification[] = [];
  let isLoading = true;

  async function fetchNotifications() {
    isLoading = true;
    try {
      const res = await apiFetch('/notifications');
      notifications = res.notifications || [];
    } catch (e) {
      // fallback
    } finally {
      isLoading = false;
    }
  }

  async function markRead(id: string) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
      toast.success('Pemberitahuan telah dibaca');
    } catch (e) {
      toast.error('Gagal memperbarui notifikasi');
    }
  }

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      notifications = notifications.map(n => ({ ...n, isRead: true }));
      toast.success('Semua pemberitahuan telah ditandai dibaca');
    } catch (e) {
      toast.error('Gagal memperbarui notifikasi');
    }
  }

  onMount(() => {
    fetchNotifications();
  });
</script>

<div class="space-y-6 animate-in fade-in duration-200">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Pusat Pemberitahuan</h1>
      <p class="text-xs text-muted-foreground">Pemberitahuan sistem, notifikasi akun, dan informasi penting.</p>
    </div>
    <button
      on:click={markAllRead}
      class="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-xs transition-all flex items-center gap-2"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-400" />
      <span>Tandai Semua Dibaca</span>
    </button>
  </div>

  <div class="bg-card border border-border/70 rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
    {#if isLoading}
      <div class="p-8 text-center text-xs text-muted-foreground">Memuat notifikasi...</div>
    {:else if notifications.length === 0}
      <div class="p-8 text-center text-xs text-muted-foreground">Belum ada pemberitahuan.</div>
    {:else}
      {#each notifications as item}
        <div class="p-4 flex items-start gap-4 hover:bg-muted/20 transition-colors {!item.isRead ? 'bg-indigo-500/5' : ''}">
          <div class="p-2 rounded-xl bg-muted shrink-0 mt-0.5">
            {#if item.type === 'success'}
              <CheckCircle2 class="w-5 h-5 text-emerald-400" />
            {:else if item.type === 'warning'}
              <AlertTriangle class="w-5 h-5 text-amber-400" />
            {:else if item.type === 'error'}
              <XCircle class="w-5 h-5 text-rose-400" />
            {:else}
              <Info class="w-5 h-5 text-indigo-400" />
            {/if}
          </div>

          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-xs text-foreground">{item.title}</h3>
              <span class="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock class="w-3 h-3" /> {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
            <p class="text-xs text-muted-foreground">{item.message}</p>
          </div>

          {#if !item.isRead}
            <button
              on:click={() => markRead(item.id)}
              class="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium"
            >
              Tandai Dibaca
            </button>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>
