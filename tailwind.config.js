/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'binance-yellow': '#f0b90b',
        'binance-dark': '#181a20',
        'binance-dark-secondary': '#1e2026',
        'binance-border': '#2b3139',
        'binance-text': '#eaecef',
        'binance-text-secondary': '#848e9c',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

