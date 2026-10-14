/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F0F0F0',
        foreground: '#121212',
        'primary-red': '#D02020',
        'primary-blue': '#1040C0',
        'primary-yellow': '#F0C020',
        'muted-gray': '#E0E0E0',
        'pale-yellow': '#FFF9C4',
      },
      fontFamily: {
        sans: ['Outfit', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'sans-serif'],
      },
      boxShadow: {
        'hard-sm': '3px 3px 0px 0px #121212',
        'hard-4': '4px 4px 0px 0px #121212',
        'hard-6': '6px 6px 0px 0px #121212',
        'hard-8': '8px 8px 0px 0px #121212',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
