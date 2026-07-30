<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let options: any = {};

  let chartElement: HTMLDivElement;
  let chartInstance: any = null;

  onMount(async () => {
    if (typeof window !== 'undefined') {
      const ApexCharts = (await import('apexcharts')).default;
      chartInstance = new ApexCharts(chartElement, options);
      await chartInstance.render();
    }
  });

  onDestroy(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
  });
</script>

<div bind:this={chartElement} class="w-full"></div>
