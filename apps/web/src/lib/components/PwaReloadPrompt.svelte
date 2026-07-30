<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  onMount(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(
        (registration) => {
          console.log('PWA ServiceWorker registered with scope:', registration.scope);
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    toast('Versi Baru Tersedia! 🎉', {
                      description: 'Tekan muat ulang untuk memperbarui ke fitur terbaru.',
                      action: {
                        label: 'Muat Ulang',
                        onClick: () => window.location.reload(),
                      },
                      duration: 10000,
                    });
                  } else {
                    toast.success('Aplikasi Siap Digunakan Offline! ⚡', {
                      description: 'Aplikasi telah di-cache untuk penggunaan tanpa koneksi internet.',
                    });
                  }
                }
              };
            }
          };
        },
        (err) => {
          console.log('PWA ServiceWorker registration failed:', err);
        }
      );
    }
  });
</script>
