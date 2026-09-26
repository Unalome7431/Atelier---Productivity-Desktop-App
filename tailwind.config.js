/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-[#FAF7F0]', 'border-[#E8E2D5]',
    'bg-[#F0F3FF]', 'border-[#DCE4FF]',
    'bg-[#F5F0FF]', 'border-[#E7DBFF]',
    'bg-[#ECFDF5]', 'border-[#D1F2E2]',
    'bg-[#FFF1F2]', 'border-[#FFE4E6]',
    'bg-[#FEFCE8]', 'border-[#FEF08A]',
    'bg-[#F0F9FF]', 'border-[#E0F2FE]',
    'bg-[#FEF3C7]', 'text-[#92400E]', 'border-[#FDE68A]',
    'bg-[#E0F2FE]', 'text-[#0369A1]', 'border-[#BAE6FD]',
    'bg-[#FFE4E6]', 'text-[#9F1239]', 'border-[#FECDD3]',
    'bg-[#EEEDFD]', 'text-[#4338CA]', 'border-[#D5CEF5]',
    'bg-[#D1FAE5]', 'text-[#065F46]', 'border-[#A7F3D0]',
    'bg-[#E8F8F0]', 'border-emerald-300/80', 'text-emerald-950', 'text-emerald-800', 'text-emerald-700', 'text-emerald-600', 'hover:bg-[#D4F4E4]',
    'bg-[#FEF3E8]', 'border-amber-300/80', 'text-amber-950', 'text-amber-800', 'text-amber-700', 'text-amber-600', 'hover:bg-[#FDE7D2]',
    'bg-[#F0EEFF]', 'border-indigo-300/80', 'text-indigo-950', 'text-indigo-800', 'text-indigo-700', 'text-indigo-600', 'hover:bg-[#E2DEFC]',
    'bg-[#EBF6FE]', 'border-sky-300/80', 'text-sky-950', 'text-sky-800', 'text-sky-700', 'text-sky-600', 'hover:bg-[#D7EDFC]',
    'bg-[#EFE9DC]', 'text-[#4A2D40]', 'border-amber-200/80', 'border-amber-200/60', 'border-amber-300', 'bg-accent-mauve/20', 'bg-accent-mauve/25', 'border-accent-mauve/40',
    'bg-[#F3E8EE]', 'border-[#DFC5D6]', 'border-[#DDD5C8]', 'border-[#C8BFB0]', 'text-[#4F483D]',
    'bg-pastel-sand-tint', 'border-pastel-sand-border',
    'bg-pastel-lavender-tint', 'border-pastel-lavender-border',
    'bg-pastel-lilac-tint', 'border-pastel-lilac-border',
    'bg-pastel-mint-tint', 'border-pastel-mint-border',
    'bg-pastel-pink-tint', 'border-pastel-pink-border',
    'bg-pastel-butter-tint', 'border-pastel-butter-border',
    'bg-pastel-blue-tint', 'border-pastel-blue-border',
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
        surface: {
          DEFAULT: '#F5F1E8',
          warm: '#F5EFE6',
          alt: '#EFE9DC',
        },
        border: {
          DEFAULT: '#EFEAE1',
          hover: '#D8D2C5',
          focus: '#C5BDAF',
          dark: '#D4CBBF',
        },

        // Accents (Pastels)
        accent: {
          indigo: '#EBE7FF',
          purple: '#EBE9FE',
          green: '#D1FAE5',
          pink: '#FCFCE8',
          blue: '#BAE6FD',
          mauve: '#8E677E',
        },

        // Semantic Pastel Palettes
        pastel: {
          mint: {
            bg: '#D1FAE5',
            text: '#065F46',
            border: '#A7F3D0',
            dot: '#34D399',
            tint: '#ECFDF5',
          },
          lavender: {
            bg: '#EBE7FF',
            text: '#4338CA',
            border: '#D5CEF5',
            dot: '#818CF8',
            tint: '#EEEDFD',
          },
          lilac: {
            bg: '#EBE9FE',
            text: '#6D28D9',
            border: '#DDD6FE',
            dot: '#C084FC',
            tint: '#F5F0FF',
          },
          blue: {
            bg: '#BAE6FD',
            text: '#0369A1',
            border: '#7DD3FC',
            dot: '#60A5FA',
            tint: '#F0F9FF',
          },
          butter: {
            bg: '#FCFCE8',
            text: '#854D0E',
            border: '#FEF08A',
            dot: '#FBBF24',
            tint: '#FEFCE8',
          },
          pink: {
            bg: '#FFE4E6',
            text: '#9F1239',
            border: '#FECDD3',
            dot: '#F472B6',
            tint: '#FFF1F2',
          },
          mauve: {
            bg: '#F3E8EE',
            text: '#8E677E',
            border: '#E5D5DF',
            dot: '#8E677E',
            tint: '#FAF4F7',
          },
          sand: {
            bg: '#FAF7F0',
            text: '#787571',
            border: '#E8E2D5',
            dot: '#D4C5A9',
            tint: '#FAF7F0',
          },
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
      scale: {
        102: '1.02',
      },
      backdropBlur: {
        xs: '2px',
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
        '2xs': '0 1px 2px rgba(45, 44, 42, 0.03)',
        xs: '0 1px 2px rgba(45, 44, 42, 0.04)',
        'inner-xs': 'inset 0 1px 2px rgba(45, 44, 42, 0.04)',
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
