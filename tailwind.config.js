/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-green-500', 'text-green-100',
    'bg-yellow-500', 'text-yellow-900',
    'bg-red-500', 'text-red-100',
    'bg-gray-500', 'text-gray-100'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D946EF',
        secondary: '#7C3AED',
        background: '#000',
        surface: '#231942',
      },
    },
  },
  plugins: [],
} 