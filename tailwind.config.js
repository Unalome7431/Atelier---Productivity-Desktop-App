/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAF8F5',
        surface: '#F5F1E8',
        border: '#EFEAE1',
        primaryDark: '#2D2C2A',
        secondaryGray: '#787571',
        midGray: '#767676',
        accent: {
          indigo: '#EBE7FF',
          purple: '#EBE9FE',
          green: '#D1FAE5',
          pink: '#FCFCE8',
          blue: '#BAE6FD',
          mauve: '#8E677E',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'panel': '20px',
        'pill': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'float': '0 4px 12px rgba(45, 44, 42, 0.08)',
        'modal': '0 12px 32px rgba(45, 44, 42, 0.12)',
      }
    },
  },
  plugins: [],
}
