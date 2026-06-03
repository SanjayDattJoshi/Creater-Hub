/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e0e0fe',
          200: '#c4c3fd',
          300: '#a5a0fb',
          400: '#8b7cf8',
          500: '#7c5ff5',
          600: '#6d44e0',
          700: '#5c33c5',
          800: '#4a28a0',
          900: '#3b2080',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        dark: {
          700: '#1a1a2e',
          800: '#12121f',
          850: '#0e0e1a',
          900: '#080812',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover:   'rgba(255,255,255,0.07)',
          active:  'rgba(124,95,245,0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand':  'linear-gradient(135deg, #7c5ff5 0%, #22d3ee 100%)',
        'gradient-dark':   'linear-gradient(135deg, #12121f 0%, #1a1a2e 100%)',
        'gradient-violet': 'linear-gradient(135deg, #7c5ff5 0%, #5c33c5 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
