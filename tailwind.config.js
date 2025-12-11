/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Custom gray colors to match Vue3/Frappe UI
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#e2e2e2', // Custom: rgb(226 226 226) - matches Vue3
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#525252', // Custom: rgb(82 82 82) - matches Vue3 border-gray-700
          800: '#383838', // Custom: rgb(56 56 56) - matches Vue3 bg-gray-800
          900: '#171717', // Custom: rgb(23 23 23) - matches Vue3 bg-gray-900
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

