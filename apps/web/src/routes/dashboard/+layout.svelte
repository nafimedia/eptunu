<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$stores/auth';
  import Sidebar from '$components/Sidebar.svelte';
  import Navbar from '$components/Navbar.svelte';
  import CommandPalette from '$components/CommandPalette.svelte';

  let isCommandPaletteOpen = false;
  let isMobileSidebarOpen = false;

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
