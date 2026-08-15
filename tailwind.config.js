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
        primary: {
          DEFAULT: '#00A86B',
          dark: '#00895A',
          light: '#CFF5E6',
        },
        accent: {
          DEFAULT: '#005B96',
          light: '#DCEEFF',
        },
        background: '#F7F4F1',
        surface: '#FFFFFF',
        soft: '#F2F2F2',
        cream: '#F4E9DE',
        card: '#F9F8F7',
        border: '#E7DDD5',
        divider: '#DED3CC',
        'text-primary': '#111111',
        'text-secondary': '#555555',
        muted: '#8A817C',
        success: '#00A86B',
        warning: '#F4B400',
        error: '#E25C5C',
        info: '#005B96',
        lavender: '#B8BDF8',
        sage: '#BFD9D2',
        mustard: '#E5D45A',
        peach: '#E78B73',
        olive: '#8B9658',
        sky: '#B7D8F5',
      },
      fontFamily: {
        headline: ['Manrope_700Bold'],
        body: ['Manrope_400Regular'],
        'body-medium': ['Manrope_500Medium'],
        'body-semibold': ['Manrope_600SemiBold'],
        'body-bold': ['Manrope_700Bold'],
      },
      borderRadius: {
        sm: '12px',
        md: '20px',
        lg: '28px',
        xl: '36px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0px 6px 18px rgba(0,0,0,0.05)',
        card: '0px 10px 30px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};