import { writable } from 'svelte/store';

type Theme = 'dark' | 'light';

const initialTheme: Theme = typeof window !== 'undefined'
  ? (localStorage.getItem('theme') as Theme) || 'dark'
  : 'dark';

export const theme = writable<Theme>(initialTheme);

if (typeof window !== 'undefined') {
  theme.subscribe((value) => {
    localStorage.setItem('theme', value);
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
}

export function toggleTheme() {
  theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
}
