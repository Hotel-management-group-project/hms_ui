/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#E8EDF4',
          100: '#C5D0E3',
          200: '#8FA3C3',
          300: '#5876A3',
          400: '#2D4E83',
          500: '#1A3461',
          600: '#0F2449',
          700: '#0A1628',
          800: '#050D1A',
          900: '#02060D',
          DEFAULT: '#0A1628',
        },
        gold: {
          50:  '#FBF6E9',
          100: '#F5EAC8',
          200: '#EDD594',
          300: '#E5BF61',
          400: '#C9A84C',
          500: '#B8973F',
          600: '#9A7D33',
          700: '#7C6428',
          800: '#5E4B1E',
          900: '#3F3214',
          DEFAULT: '#C9A84C',
        },
        cream: {
          50:  '#FDFCF9',
          100: '#FAF8F3',
          200: '#F5F0E8',
          300: '#EDE5D5',
          400: '#E0D4BC',
          DEFAULT: '#F5F0E8',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.6s ease-out',
        'fade-up':  'fadeUp 0.8s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'gold-shimmer': 'goldShimmer 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        goldShimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'luxury':    '0 4px 24px rgba(10, 22, 40, 0.15)',
        'luxury-lg': '0 8px 48px rgba(10, 22, 40, 0.25)',
        'gold':      '0 4px 24px rgba(201, 168, 76, 0.3)',
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #0A1628 0%, #1A3461 50%, #0A1628 100%)',
        'gradient-gold':   'linear-gradient(90deg, #C9A84C 0%, #E5BF61 50%, #C9A84C 100%)',
      },
    },
  },
  plugins: [],
}
