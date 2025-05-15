/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ft-black': '#111827',
        'ft-blue': '#1E40AF',
        'seat-available': '#22C55E',
        'seat-occupied': '#EF4444',
        'seat-unavailable': '#6B7280',
      },
    },
  },
  plugins: [],
}