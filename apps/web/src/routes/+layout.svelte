<script lang="ts">
  import '../app.css';
  import { Toaster } from 'svelte-sonner';
  import PwaReloadPrompt from '$lib/components/PwaReloadPrompt.svelte';
</script>

<Toaster position="top-right" richColors />
<PwaReloadPrompt />
<slot />
