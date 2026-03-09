import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        // Light mode
        'light-bg': '#ffffff',
        'light-text': '#1a1a1a',
        'light-muted': '#555555',
        'light-border': 'rgba(0, 0, 0, 0.08)',
        // Dark mode
        'dark-bg': '#111111',
        'dark-text': '#e8e6e3',
        'dark-muted': '#888888',
        'dark-border': 'rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
