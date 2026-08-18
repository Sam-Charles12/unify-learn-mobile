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
        // Core Neutral Foundation — Warm Palette
        ink: {
          DEFAULT: '#1A1A1A',       // Slightly softer black
          secondary: '#2D2D2D',
          muted: '#5C5550',
        },
        background: '#F8F6F3',         // Warm linen
        'background-subtle': '#F2EDE8', // Warm sand
        surface: '#FFFFFF',            // Pure White
        card: '#FFFFFF',
        soft: '#F2EDE8',               // Warm sand (used for muted backgrounds)
        cream: '#FAF5EF',              // Warm cream
        border: '#E7DDD5',             // Warm stone
        divider: '#F0EAE3',            // Softer warm divider

        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6560',
        muted: '#8A817C',

        // Glassmorphism tokens
        glass: 'rgba(255,255,255,0.65)',
        'glass-strong': 'rgba(255,255,255,0.82)',
        'glass-tinted': 'rgba(0,168,107,0.06)',

        // Pastel card backgrounds (Dribbble-inspired variety)
        'pastel-sage': '#E8F0EC',
        'pastel-lavender': '#ECEAF4',
        'pastel-blush': '#F5EAEA',
        'pastel-cream': '#F4E9DE',
        'pastel-sky': '#E4EDF6',

        // Curated Sophisticated Accent Palette
        primary: {
          DEFAULT: '#059669', // Emerald 600 — Unify brand stays
          dark: '#047857',
          light: '#ECFDF5',
          border: '#A7F3D0',
        },
        cobalt: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#EFF6FF',
          border: '#BFDBFE',
        },
        amber: {
          DEFAULT: '#D97706',
          dark: '#B45309',
          light: '#FFFBEB',
          border: '#FDE68A',
        },
        violet: {
          DEFAULT: '#7C3AED',
          dark: '#6D28D9',
          light: '#F5F3FF',
          border: '#DDD6FE',
        },
        rose: {
          DEFAULT: '#E11D48',
          dark: '#BE123C',
          light: '#FFF1F2',
          border: '#FECDD3',
        },
        teal: {
          DEFAULT: '#0D9488',
          dark: '#0F766E',
          light: '#F0FDFA',
          border: '#99F6E4',
        },

        // Accent (for timetable header etc.)
        accent: {
          DEFAULT: '#005B96',
          light: '#DCEEFF',
          border: '#B3D4F0',
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
        sm: '10px',
        md: '16px',
        lg: '22px',
        xl: '28px',
        '2xl': '32px',
        '3xl': '36px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0px 2px 8px rgba(0, 0, 0, 0.04)',
        card: '0px 4px 16px rgba(0, 0, 0, 0.06)',
        elevated: '0px 12px 40px rgba(0, 0, 0, 0.08)',
        'float': '0px 8px 30px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
};