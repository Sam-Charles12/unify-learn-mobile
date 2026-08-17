/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core Neutral Foundation
        ink: {
          DEFAULT: '#09090B', // Zinc 950
          secondary: '#27272A', // Zinc 800
          muted: '#52525B',     // Zinc 600
        },
        background: '#FAFAFA',        // Ultra-clean warm off-white
        'background-subtle': '#F4F4F5', // Zinc 100
        surface: '#FFFFFF',          // Pure White
        card: '#FFFFFF',
        soft: '#F4F4F5',
        cream: '#FAF8F5',
        border: '#E4E4E7',           // Zinc 200 (crisp hairline)
        divider: '#F4F4F5',
        'text-primary': '#09090B',
        'text-secondary': '#52525B',
        muted: '#71717A',

        // Curated Sophisticated Accent Palette
        primary: {
          DEFAULT: '#059669', // Emerald 600
          dark: '#047857',    // Emerald 700
          light: '#ECFDF5',   // Emerald 50
          border: '#A7F3D0',  // Emerald 200
        },
        cobalt: {
          DEFAULT: '#2563EB', // Blue 600
          dark: '#1D4ED8',    // Blue 700
          light: '#EFF6FF',   // Blue 50
          border: '#BFDBFE',  // Blue 200
        },
        amber: {
          DEFAULT: '#D97706', // Amber 600
          dark: '#B45309',    // Amber 700
          light: '#FFFBEB',   // Amber 50
          border: '#FDE68A',  // Amber 200
        },
        violet: {
          DEFAULT: '#7C3AED', // Violet 600
          dark: '#6D28D9',    // Violet 700
          light: '#F5F3FF',   // Violet 50
          border: '#DDD6FE',  // Violet 200
        },
        rose: {
          DEFAULT: '#E11D48', // Rose 600
          dark: '#BE123C',    // Rose 700
          light: '#FFF1F2',   // Rose 50
          border: '#FECDD3',  // Rose 200
        },
        teal: {
          DEFAULT: '#0D9488', // Teal 600
          dark: '#0F766E',    // Teal 700
          light: '#F0FDFA',   // Teal 50
          border: '#99F6E4',  // Teal 200
        },

        // Semantic
        success: '#059669',
        warning: '#D97706',
        error: '#E11D48',
        info: '#2563EB',

        // Legacy compat
        emerald: {
          DEFAULT: '#059669',
          bg: '#ECFDF5',
          border: '#A7F3D0',
          text: '#047857',
        },
        indigo: {
          DEFAULT: '#2563EB',
          bg: '#EFF6FF',
          border: '#BFDBFE',
          text: '#1D4ED8',
        },
      },
      fontFamily: {
        headline: ['Manrope_700Bold'],
        body: ['Manrope_400Regular'],
        'body-medium': ['Manrope_500Medium'],
        'body-semibold': ['Manrope_600SemiBold'],
        'body-bold': ['Manrope_700Bold'],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '26px',
        '2xl': '32px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0px 1px 3px rgba(0, 0, 0, 0.03)',
        card: '0px 2px 8px rgba(0, 0, 0, 0.04)',
        elevated: '0px 12px 32px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};