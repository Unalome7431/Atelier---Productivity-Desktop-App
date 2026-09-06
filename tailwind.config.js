/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutrals
        primaryDark: '#2D2C2A',
        secondaryGray: '#787571',
        midGray: '#767676',
        white: '#FFFFFF',

        // Surfaces
        bg: '#FAF8F5',
        surface: '#F5F1E8',
        border: '#EFEAE1',

        // Accents (Pastels)
        accent: {
          indigo: '#EBE7FF',
          purple: '#EBE9FE',
          green: '#D1FAE5',
          pink: '#FCFCE8',
          blue: '#BAE6FD',
          mauve: '#8E677E',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Display (Outfit)
        'display-1': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'display-2': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'display-3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'display-4': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'display-5': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'display-6': ['14px', { lineHeight: '20px', fontWeight: '600' }],

        // UI & Body (DM Sans)
        'ui-bold-sm': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'ui-bold-xs': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'ui-md-sm': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'ui-md-xs': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'ui-rg-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'ui-rg-xs': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'ui-rg-xxs': ['11px', { lineHeight: '14px', fontWeight: '400' }],

        // System & Metrics (JetBrains Mono)
        'mono-lg': ['18px', { lineHeight: '24px', fontWeight: '700' }],
        'mono-uppercase': ['10px', { lineHeight: '14px', fontWeight: '700', letterSpacing: '0.06em' }],
        'mono-md': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'mono-xs': ['10px', { lineHeight: '14px', fontWeight: '400', letterSpacing: '0.05em' }],
        'mono-tag': ['9px', { lineHeight: '12px', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        card: '16px',
        panel: '20px',
        pill: '9999px',
      },
      boxShadow: {
        hairline: '0 0 0 1px #EFEAE1',
        subtle: '0 1px 3px rgba(45, 44, 42, 0.04), 0 1px 2px rgba(45, 44, 42, 0.02)',
        card: '0 2px 8px rgba(45, 44, 42, 0.04)',
        float: '0 4px 12px rgba(45, 44, 42, 0.08)',
        modal: '0 12px 32px rgba(45, 44, 42, 0.12)',
      },
    },
  },
  plugins: [],
};
