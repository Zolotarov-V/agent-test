/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Frutiger', 'ui-sans-serif', 'system-ui'],
        frutiger: ['Frutiger', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
