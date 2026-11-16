/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dnd: {
          bg: '#0f1117',
          bg2: '#161922',
          panel: '#1a1d27',
          panel2: '#21252f',
          border: '#c8aa6e',
          bordDim: '#8a7350',
          bordDark: '#3d3528',
          gold: '#c8aa6e',
          goldBright: '#e8d5a8',
          text: '#d4c5a0',
          textDim: '#9a8a6a',
          textMuted: '#6a6050',
          hp: '#e34d4d',
          hpDim: '#9b3232',
          hpBg: '#2a1515',
          mp: '#5b8def',
          mpDim: '#3a5a9e',
          success: '#5eba7d',
          warn: '#f0ad4e',
          danger: '#e34d4d',
          dark: '#0a0c12',
          accent: '#a87f4a',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadein 0.4s ease-out',
        'slide-up': 'slideup 0.3s ease-out',
        'slide-right': 'slideright 0.3s ease-out',
        'glow-pulse': 'glowpulse 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 4s linear infinite',
      },
      keyframes: {
        fadein: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideup: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideright: { '0%': { transform: 'translateX(-12px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        glowpulse: { '0%,100%': { boxShadow: '0 0 6px rgba(200,170,110,0.2)' }, '50%': { boxShadow: '0 0 16px rgba(200,170,110,0.5)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
