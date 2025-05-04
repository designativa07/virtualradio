/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6', // blue-500
          dark: '#1d4ed8',    // blue-700
          light: '#93c5fd',   // blue-300
        },
        secondary: {
          DEFAULT: '#f59e0b', // amber-500
          dark: '#b45309',    // amber-700
          light: '#fcd34d',   // amber-300
        },
      },
    },
  },
  plugins: [],
}; 