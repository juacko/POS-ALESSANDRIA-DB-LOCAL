/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/renderer/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5', // Índigo primario
          hover: '#4338ca',
          light: '#e0e7ff',
        },
        mint: {
          DEFAULT: '#10b981', // Verde Mint / Libre
          hover: '#059669',
          light: '#d1fae5',
        },
        amber: {
          DEFAULT: '#f59e0b', // Ámbar / Ocupado / Warning
          light: '#fef3c7',
        },
        rose: {
          DEFAULT: '#ef4444', // Rose / Danger
          light: '#fee2e2',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
