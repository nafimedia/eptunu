<script lang="ts">
  import { page } from '$app/stores';
  import { auth, hasPermission } from '$stores/auth';
  import {
    LayoutDashboard,
    User,
    Users,
    ShieldCheck,
    FileText,
    Bell,
    Settings,
    LogOut,
    Sparkles
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { clearAuth } from '$stores/auth';

  export let isMobileOpen = false;

  $: user = $auth.user;

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, perm: null },
    { label: 'Profil Saya', href: '/dashboard/profile', icon: User, perm: null },
    { label: 'Pengguna (Users)', href: '/dashboard/users', icon: Users, perm: 'users:read' },
    { label: 'Role & Izin', href: '/dashboard/roles', icon: ShieldCheck, perm: 'roles:read' },
    { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, perm: 'audit:read' },
    { label: 'Notifikasi', href: '/dashboard/notifications', icon: Bell, perm: null },
  ];

  $: filteredMenu = menuItems.filter(item => {
    if (!item.perm) return true;
    return hasPermission(user, item.perm);
  });

  function handleLogout() {
    clearAuth();
    goto('/login');
  }
</script>

<!-- Desktop Sidebar -->
<aside class="hidden lg:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-md h-screen sticky top-0">
  <!-- Brand Logo Header -->
  <div class="h-16 px-6 flex items-center justify-between border-b border-border">
    <a href="/dashboard" class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
        <Sparkles class="w-5 h-5" />
      </div>
      <span class="font-bold text-base bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">FairuzKit</span>
    </a>
  </div>

  <!-- Navigation Menu List -->
  <div class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
    {#each filteredMenu as item}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group {$page.url.pathname === item.href ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      >
        <svelte:component this={item.icon} class="w-4 h-4" />
        <span>{item.label}</span>
      </a>
    {/each}
  </div>

  <!-- User Account Card & Logout Footer -->
  <div class="p-4 border-t border-border bg-muted/20">
    <a href="/dashboard/profile" class="flex items-center gap-3 p-2 rounded-lg bg-card border border-border/50 hover:bg-muted/50 transition-colors group">
      {#if user?.avatarUrl}
        <img src={user.avatarUrl} alt={user?.name} class="w-8 h-8 rounded-full object-cover border border-primary" />
      {:else}
        <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
      {/if}
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold truncate group-hover:text-primary transition-colors">{user?.name || 'Pengguna'}</p>
        <p class="text-[10px] text-muted-foreground truncate">{user?.email}</p>
      </div>
      <button on:click|preventDefault={handleLogout} title="Logout" class="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
        <LogOut class="w-4 h-4" />
      </button>
    </a>
  </div>
</aside>

<!-- Mobile Slide-over Drawer -->
{#if isMobileOpen}
  <div class="fixed inset-0 z-50 lg:hidden flex">
    <button
      type="button"
      aria-label="Tutup menu sidebar"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm border-0 w-full h-full text-left cursor-default"
      on:click={() => (isMobileOpen = false)}
    ></button>
    <div class="relative w-64 bg-card border-r border-border h-full flex flex-col z-10 animate-in slide-in-from-left duration-200">
      <div class="h-16 px-6 flex items-center justify-between border-b border-border">
        <a href="/dashboard" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
            <Sparkles class="w-4 h-4" />
          </div>
          <span class="font-bold text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">FairuzKit</span>
        </a>
      </div>
      <div class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {#each filteredMenu as item}
          <a
            href={item.href}
            on:click={() => (isMobileOpen = false)}
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all {$page.url.pathname === item.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}"
          >
            <svelte:component this={item.icon} class="w-4 h-4" />
            <span>{item.label}</span>
          </a>
        {/each}
      </div>
    </div>
  </div>
{/if}

