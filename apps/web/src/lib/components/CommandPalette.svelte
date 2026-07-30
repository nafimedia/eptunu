<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toggleTheme } from '$stores/theme';
  import { clearAuth } from '$stores/auth';
  import { Search, LayoutDashboard, Users, ShieldCheck, FileText, Bell, Moon, LogOut, X, User } from 'lucide-svelte';

  export let isOpen = false;
  let query = '';

  const actions = [
    { name: 'Dashboard Overview', icon: LayoutDashboard, href: '/dashboard', category: 'Navigation' },
    { name: 'Profil Saya (Pengaturan Akun)', icon: User, href: '/dashboard/profile', category: 'Navigation' },
    { name: 'User Management', icon: Users, href: '/dashboard/users', category: 'Navigation' },
    { name: 'Roles & Permissions', icon: ShieldCheck, href: '/dashboard/roles', category: 'Navigation' },
    { name: 'Audit Logs', icon: FileText, href: '/dashboard/audit-logs', category: 'Navigation' },
    { name: 'Notification Center', icon: Bell, href: '/dashboard/notifications', category: 'Navigation' },
    { name: 'Toggle Dark / Light Mode', icon: Moon, action: () => toggleTheme(), category: 'Actions' },
    { name: 'Logout Account', icon: LogOut, action: () => { clearAuth(); goto('/login'); }, category: 'Actions' },
  ];

  $: filteredActions = actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      isOpen = !isOpen;
    }
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
    }
  }

  function execute(item: typeof actions[0]) {
    isOpen = false;
    query = '';
    if (item.href) {
      goto(item.href);
    } else if (item.action) {
      item.action();
    }
  }

  function focusInput(node: HTMLInputElement) {
    node.focus();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 transition-opacity">
    <div class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <!-- Search Input Header -->
      <div class="flex items-center px-4 border-b border-border bg-muted/30">
        <Search class="w-5 h-5 text-muted-foreground mr-3" />
        <input
          type="text"
          bind:value={query}
          placeholder="Type a command or search routes (e.g. Users, Audit, Theme)..."
          class="w-full py-4 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          use:focusInput
        />
        <button on:click={() => (isOpen = false)} class="p-1 rounded-md text-muted-foreground hover:bg-muted">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Action Items List -->
      <div class="max-h-80 overflow-y-auto p-2">
        {#if filteredActions.length === 0}
          <div class="p-6 text-center text-sm text-muted-foreground">No matching commands found.</div>
        {:else}
          {#each filteredActions as item}
            <button
              on:click={() => execute(item)}
              class="w-full flex items-center px-3 py-2.5 rounded-lg text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors group"
            >
              <svelte:component this={item.icon} class="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <span class="flex-1 font-medium">{item.name}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{item.category}</span>
            </button>
          {/each}
        {/if}
      </div>

      <!-- Footer Shortcut Hints -->
      <div class="px-4 py-2 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Use <kbd class="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">↑</kbd> <kbd class="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">↓</kbd> to navigate</span>
        <span><kbd class="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">ESC</kbd> to close</span>
      </div>
    </div>
  </div>
{/if}
