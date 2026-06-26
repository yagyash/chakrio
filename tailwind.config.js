/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Hanken Grotesk'", 'DM Sans', 'sans-serif'],
        display: ["'Bricolage Grotesque'", 'Syne', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        sidebar: '#16151f',
        'sidebar-text': '#8c8a9e',
        'sidebar-active': '#C9A24B',
        brand: '#6C63FF',
        'brand-end': '#00D4FF',
        'bg-app': '#0E0B14',
        surface: '#16151f',
        surface2: '#1e1c2a',
        surface3: '#252336',
        accent: '#C9A24B',
        gold: '#C9A24B',
        'dark-bg': '#0E0B14',
        'off-white': '#F4F1EA',
        accent2: '#7c6af5',
        accent3: '#4ecdc4',
        'text-1': '#F4F1EA',
        'text-2': '#CFCAD9',
        'text-3': '#9D98AC',
        'ch-green': '#5cb88a',
        'ch-red': '#e07070',
        'ch-amber': '#e8a86a',
      },
    },
  },
  plugins: [],
}

