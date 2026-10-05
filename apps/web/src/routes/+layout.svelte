<script lang="ts">
  import '../app.css';
  import { Toaster } from 'svelte-sonner';
  import PwaReloadPrompt from '$lib/components/PwaReloadPrompt.svelte';
  import { theme } from '$stores/theme';
</script>

<Toaster position="top-right" richColors />
<PwaReloadPrompt />
<slot />
