/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          violet: '#7C3AED',
          deep: '#6D28D9',
        },
        surface: {
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        display: ['Geist', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 14px 0 rgba(124, 58, 237, 0.1)',
      },
      borderRadius: {
        card: '20px',
      }
    },
  },
  plugins: [],
}
