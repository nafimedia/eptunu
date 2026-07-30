<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import type { AuditLog } from '$types';
  import { FileText, Search, Clock, User, HardDrive } from 'lucide-svelte';

  let logs: AuditLog[] = [];
  let isLoading = true;
  let searchQuery = '';

  async function fetchAuditLogs() {
    isLoading = true;
    try {
      let queryParams = '?limit=20';
      if (searchQuery) queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await apiFetch(`/audit-logs${queryParams}`);
      logs = res.data || [];
    } catch (e) {
      // fallback
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchAuditLogs();
  });
</script>

<div class="space-y-6 animate-in fade-in duration-200">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Audit Logs Sistem</h1>
    <p class="text-xs text-muted-foreground">Catatan riwayat aktivitas dan mutasi data keamanan sistem.</p>
  </div>

  <div class="p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
    <div class="relative w-full sm:w-80">
      <Search class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
      <input
        type="text"
        bind:value={searchQuery}
        on:input={fetchAuditLogs}
        placeholder="Cari aktivitas, entitas, atau pengguna..."
        class="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  </div>

  <div class="bg-card border border-border/70 rounded-2xl shadow-sm overflow-hidden">
    <div class="divide-y divide-border">
      {#if isLoading}
        <div class="p-8 text-center text-xs text-muted-foreground">Memuat catatan audit log...</div>
      {:else if logs.length === 0}
        <div class="p-8 text-center text-xs text-muted-foreground">Tidak ada catatan audit log.</div>
      {:else}
        {#each logs as log}
          <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-primary">{log.action}</span>
                <span class="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] text-muted-foreground">{log.entity}</span>
              </div>
              <p class="text-muted-foreground flex items-center gap-1.5">
                <User class="w-3 h-3 text-muted-foreground" /> {log.user?.name || 'System Auto'} ({log.user?.email || 'System'})
              </p>
            </div>

            <div class="flex items-center gap-4 text-muted-foreground text-[11px]">
              <span class="flex items-center gap-1"><HardDrive class="w-3 h-3" /> {log.ipAddress || '127.0.0.1'}</span>
              <span class="flex items-center gap-1"><Clock class="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}</span>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
