/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e9ff',
          200: '#bcd9ff',
          300: '#8ec0ff',
          400: '#5aa0ff',
          500: '#2f7dfb',
          600: '#1c5fef',
          700: '#1649c7',
          800: '#173f9e',
          900: '#17387c',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f7f8fa',
          dark: '#0f1115',
          'dark-subtle': '#171a21',
        },
        ink: {
          DEFAULT: '#14161a',
          muted: '#5b6270',
          inverted: '#f5f6f8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -4px rgb(0 0 0 / 0.08)',
        'soft-lg': '0 4px 8px -2px rgb(0 0 0 / 0.06), 0 12px 32px -8px rgb(0 0 0 / 0.12)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
