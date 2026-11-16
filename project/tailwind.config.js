/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f1117',
          secondary: '#161922',
          panel: '#1a1d27',
          panel2: '#21252f',
          dark: '#0a0c12',
        },
        gold: {
          DEFAULT: '#c8aa6e',
          bright: '#e8d5a8',
          dim: '#8a7350',
          dark: '#3d3528',
        },
        ink: {
          DEFAULT: '#d4c5a0',
          dim: '#9a8a6a',
          muted: '#6a6050',
        },
        hp: {
          DEFAULT: '#e34d4d',
          dim: '#9b3232',
          bg: '#2a1515',
        },
        mana: {
          DEFAULT: '#5b8def',
          dim: '#3a5a9e',
        },
        emerald: {
          DEFAULT: '#5eba7d',
          dim: '#3a7a55',
        },
        amber: {
          DEFAULT: '#f0ad4e',
          dim: '#b8862e',
        },
        danger: '#e34d4d',
        warning: '#f0ad4e',
        success: '#5eba7d',
      },
      fontFamily: {
        fantasy: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadein 0.4s ease-out',
        'slide-up': 'slideup 0.3s ease-out',
        'slide-right': 'slideright 0.3s ease-out',
        'glow-pulse': 'glowpulse 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 4s linear infinite',
        'dice-roll': 'diceroll 0.8s ease-out',
        'slide-in-right': 'slideinright 0.3s ease-out',
      },
      keyframes: {
        fadein: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideup: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideright: { '0%': { transform: 'translateX(-12px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideinright: { '0%': { transform: 'translateX(20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        glowpulse: { '0%,100%': { boxShadow: '0 0 6px rgba(200,170,110,0.2)' }, '50%': { boxShadow: '0 0 16px rgba(200,170,110,0.5)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        diceroll: {
          '0%': { transform: 'rotateX(0) rotateY(0) scale(0.5)', opacity: '0' },
          '50%': { transform: 'rotateX(720deg) rotateY(360deg) scale(1.3)', opacity: '1' },
          '100%': { transform: 'rotateX(1440deg) rotateY(720deg) scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
