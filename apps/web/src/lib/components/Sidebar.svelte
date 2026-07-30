<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '$stores/auth';
  import {
    LayoutDashboard,
    User,
    UserCheck,
    Users,
    ShieldCheck,
    FileText,
    Bell,
    Settings,
    Database,
    FileQuestion,
    Calendar,
    LogOut,
    Sparkles,
    Award,
    FileCheck,
    BarChart3
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { clearAuth } from '$stores/auth';

  export let isMobileOpen = false;

  $: user = $auth.user;
  $: role = (user?.role || '').toUpperCase();

  interface MenuItem {
    label: string;
    href: string;
    icon: any;
    roles: string[] | null;
  }

  interface MenuGroup {
    title: string;
    items: MenuItem[];
  }

  export const menuGroups: MenuGroup[] = [
    {
      title: 'UTAMA',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: null },
        { label: 'Notifikasi', href: '/dashboard/notifications', icon: Bell, roles: null },
        { label: 'Profil Saya', href: '/dashboard/profile', icon: User, roles: null },
      ],
    },
    {
      title: 'PELAKSANAAN UJIAN',
      items: [
        { label: 'Pendaftaran EPT', href: '/dashboard/registrations', icon: UserCheck, roles: ['STUDENT', 'SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'] },
        { label: 'Jadwal Ujian', href: '/dashboard/schedule', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE', 'STUDENT'] },
        { label: 'Hasil & Penilaian', href: '/dashboard/results', icon: Award, roles: null },
        { label: 'Sertifikat EPT', href: '/dashboard/certificates', icon: FileCheck, roles: null },
      ],
    },
    {
      title: 'BANK SOAL',
      items: [
        { label: 'Bank Soal EPT', href: '/dashboard/questions', icon: FileQuestion, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'QUESTION_AUTHOR', 'VALIDATOR'] },
      ],
    },
    {
      title: 'LAPORAN & ANALITIK',
      items: [
        { label: 'Laporan & Rekapitulasi', href: '/dashboard/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'EXECUTIVE', 'PROCTOR'] },
      ],
    },
    {
      title: 'PENGATURAN & MASTER',
      items: [
        { label: 'Master Data', href: '/dashboard/master-data', icon: Database, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'] },
        { label: 'Manajemen Pengguna', href: '/dashboard/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'] },
        { label: 'Role & Hak Akses', href: '/dashboard/roles', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'] },
        { label: 'Notifikasi WA & Email', href: '/dashboard/settings?tab=notifications', icon: Bell, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR'] },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'] },
        { label: 'Pengaturan Sistem', href: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'] },
      ],
    },
  ];

  $: filteredGroups = menuGroups.map(group => ({
    title: group.title,
    items: group.items.filter(item => !item.roles || item.roles.includes(role))
  })).filter(group => group.items.length > 0);

  function handleLogout() {
    clearAuth();
    goto('/login');
  }
</script>

<!-- Desktop Sidebar -->
<aside class="hidden lg:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-md h-screen sticky top-0">
  <!-- Brand Logo Header -->
  <div class="h-16 px-6 flex items-center justify-between border-b border-border shrink-0">
    <a href="/dashboard" class="flex items-center gap-3">
      <img src="/logo.png" alt="UNU Purwokerto Logo" class="w-9 h-9 object-contain drop-shadow-sm" />
      <span class="font-extrabold text-base bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">EPTUNU CBT</span>
    </a>
  </div>

  <!-- Navigation Menu Groups List -->
  <div class="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
    {#each filteredGroups as group}
      <div class="space-y-1">
        <div class="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">
          {group.title}
        </div>
        {#each group.items as item}
          <a
            href={item.href}
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group {$page.url.pathname === item.href ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
          >
            <svelte:component this={item.icon} class="w-4 h-4 shrink-0" />
            <span class="truncate">{item.label}</span>
          </a>
        {/each}
      </div>
    {/each}
  </div>

  <!-- User Account Card & Logout Footer -->
  <div class="p-3 border-t border-border bg-muted/20 shrink-0">
    <a href="/dashboard/profile" class="flex items-center gap-3 p-2 rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-colors group">
      {#if user?.avatarUrl}
        <img src={user.avatarUrl} alt={user?.name || user?.fullName} class="w-8 h-8 rounded-full object-cover border border-primary shrink-0" />
      {:else}
        <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
          {user?.fullName ? user.fullName[0].toUpperCase() : (user?.name ? user.name[0].toUpperCase() : 'U')}
        </div>
      {/if}
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold truncate group-hover:text-primary transition-colors">{user?.fullName || user?.name || 'Pengguna'}</p>
        <p class="text-[10px] text-muted-foreground truncate">{user?.email}</p>
      </div>
      <button on:click|preventDefault={handleLogout} title="Logout" class="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
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
      <div class="h-16 px-6 flex items-center justify-between border-b border-border shrink-0">
        <a href="/dashboard" class="flex items-center gap-3">
          <img src="/logo.png" alt="UNU Purwokerto Logo" class="w-8 h-8 object-contain drop-shadow-sm" />
          <span class="font-extrabold text-sm bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">EPTUNU CBT</span>
        </a>
      </div>
      <div class="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {#each filteredGroups as group}
          <div class="space-y-1">
            <div class="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">
              {group.title}
            </div>
            {#each group.items as item}
              <a
                href={item.href}
                on:click={() => (isMobileOpen = false)}
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all {$page.url.pathname === item.href ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted'}"
              >
                <svelte:component this={item.icon} class="w-4 h-4 shrink-0" />
                <span class="truncate">{item.label}</span>
              </a>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
