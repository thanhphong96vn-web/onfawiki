/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'onfa-yellow': '#f0b90b',
        'onfa-dark': '#181a20',
        'onfa-dark-secondary': '#1e2026',
        'onfa-border': '#2b3139',
        'onfa-text': '#eaecef',
        'onfa-text-secondary': '#848e9c',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

