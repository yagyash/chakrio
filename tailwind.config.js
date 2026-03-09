/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
      colors: {
        sidebar: '#16151f',
        'sidebar-text': '#8c8a9e',
        'sidebar-active': '#c8a96e',
        brand: '#6C63FF',
        'brand-end': '#00D4FF',
        'bg-app': '#0f0e17',
        surface: '#16151f',
        surface2: '#1e1c2a',
        surface3: '#252336',
        accent: '#c8a96e',
        accent2: '#7c6af5',
        accent3: '#4ecdc4',
        'text-1': '#f0eee8',
        'text-2': '#8c8a9e',
        'text-3': '#56546a',
        'ch-green': '#5cb88a',
        'ch-red': '#e07070',
        'ch-amber': '#e8a86a',
      },
    },
  },
  plugins: [],
}

