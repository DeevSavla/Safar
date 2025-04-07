/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#56288A',
          light: '#864BD8',
          dark: '#3E1D66',
        },
      },
    },
  },
  plugins: [],
} 