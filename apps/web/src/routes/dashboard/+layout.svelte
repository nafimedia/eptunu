<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$stores/auth';
  import Sidebar from '$components/Sidebar.svelte';
  import Navbar from '$components/Navbar.svelte';
  import CommandPalette from '$components/CommandPalette.svelte';

  let isCommandPaletteOpen = false;
  let isMobileSidebarOpen = false;

  const routePermissions: Record<string, string[]> = {
    '/dashboard/users': ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'],
    '/dashboard/roles': ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'],
    '/dashboard/master-data': ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'],
    '/dashboard/settings': ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'],
    '/dashboard/audit-logs': ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'],
    '/dashboard/questions': ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'QUESTION_AUTHOR', 'VALIDATOR'],
    '/dashboard/reports': ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'EXECUTIVE', 'PROCTOR'],
    '/dashboard/registrations': ['STUDENT', 'SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN'],
    '/dashboard/schedule': ['SUPER_ADMIN', 'ADMIN_EPT', 'ADMIN', 'PROCTOR', 'EXECUTIVE', 'STUDENT'],
  };

  $: {
    if ($auth.isAuthenticated && $auth.user) {
      const userRole = ($auth.user.role || '').toUpperCase();
      const currentPath = $page.url.pathname;

      for (const [pathPrefix, allowedRoles] of Object.entries(routePermissions)) {
        if (currentPath.startsWith(pathPrefix)) {
          if (!allowedRoles.includes(userRole) && userRole !== 'SUPER_ADMIN') {
            goto('/dashboard');
          }
          break;
        }
      }
    }
  }

  onMount(() => {
    if (!$auth.isAuthenticated) {
      goto('/login');
    }
  });

  function toggleCommandPalette() {
    isCommandPaletteOpen = !isCommandPaletteOpen;
  }

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }
</script>

<div class="min-h-screen flex bg-background">
  <!-- Desktop & Mobile Sidebar -->
  <Sidebar isMobileOpen={isMobileSidebarOpen} />

  <!-- Main Content Shell -->
  <div class="flex-1 flex flex-col min-w-0">
    <Navbar
      toggleCommandPalette={toggleCommandPalette}
      toggleMobileSidebar={toggleMobileSidebar}
    />

    <main class="flex-1 p-4 lg:p-8 overflow-y-auto">
      <slot />
    </main>
  </div>

  <!-- Command Palette Modal -->
  <CommandPalette bind:isOpen={isCommandPaletteOpen} />
</div>
