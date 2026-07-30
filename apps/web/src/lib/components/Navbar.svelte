<script lang="ts">
  import { onMount } from 'svelte';
  import { theme, toggleTheme } from '$stores/theme';
  import { auth } from '$stores/auth';
  import { Sun, Moon, Bell, Search, Menu, CheckCircle } from 'lucide-svelte';
  import { apiFetch } from '$api/client';
  import type { Notification } from '$types';

  export let toggleCommandPalette: () => void;
  export let toggleMobileSidebar: () => void;

  let notifications: Notification[] = [];
  let unreadCount = 0;
  let isNotifOpen = false;

  async function fetchNotifications() {
    try {
      const res = await apiFetch('/notifications');
      notifications = res.notifications || [];
      unreadCount = res.unreadCount || 0;
    } catch (e) {
      // Graceful fallback
    }
  }

  async function markAllAsRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      unreadCount = 0;
      notifications = notifications.map(n => ({ ...n, isRead: true }));
    } catch (e) {
      // handle error
    }
  }

  onMount(() => {
    fetchNotifications();
  });
</script>

<header class="h-16 border-b border-border bg-card/60 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
  <!-- Mobile Menu Button & Command Palette trigger -->
  <div class="flex items-center gap-3">
    <button on:click={toggleMobileSidebar} class="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted">
      <Menu class="w-5 h-5" />
    </button>

    <!-- Quick Search / Command Palette Bar -->
    <button
      on:click={toggleCommandPalette}
      class="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground text-xs transition-colors w-48 sm:w-64"
    >
      <Search class="w-4 h-4" />
      <span class="flex-1 text-left truncate">Cari atau tekan Ctrl + K...</span>
      <kbd class="hidden sm:inline-block px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono">⌘K</kbd>
    </button>
  </div>

  <!-- Right Actions: Theme Toggle & Notification Popover -->
  <div class="flex items-center gap-2">
    <!-- Theme Toggle -->
    <button
      on:click={toggleTheme}
      class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Switch Theme"
    >
      {#if $theme === 'dark'}
        <Sun class="w-5 h-5 text-amber-400" />
      {:else}
        <Moon class="w-5 h-5 text-indigo-600" />
      {/if}
    </button>

    <!-- Notification Dropdown Bell -->
    <div class="relative">
      <button
        on:click={() => (isNotifOpen = !isNotifOpen)}
        class="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell class="w-5 h-5" />
        {#if unreadCount > 0}
          <span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-card animate-pulse"></span>
        {/if}
      </button>

      {#if isNotifOpen}
        <div class="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-border pb-3 mb-3">
            <h3 class="font-semibold text-sm">Pemberitahuan</h3>
            {#if unreadCount > 0}
              <button on:click={markAllAsRead} class="text-xs text-primary hover:underline flex items-center gap-1">
                <CheckCircle class="w-3.5 h-3.5" /> Tandai Semua Dibaca
              </button>
            {/if}
          </div>

          <div class="space-y-2 max-h-72 overflow-y-auto">
            {#if notifications.length === 0}
              <p class="text-xs text-muted-foreground text-center py-6">Belum ada notifikasi.</p>
            {:else}
              {#each notifications as item}
                <div class="p-2.5 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-1">
                  <div class="flex items-center justify-between font-medium text-foreground">
                    <span>{item.title}</span>
                    <span class="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p class="text-muted-foreground">{item.message}</p>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</header>
