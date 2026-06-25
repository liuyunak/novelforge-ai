/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0c0f1a',
          surface: '#151929',
          elevated: '#1c2237',
          border: '#2a3150',
        },
        accent: {
          DEFAULT: '#f59e0b',
          dim: 'rgba(245,158,11,0.12)',
        },
        blue: {
          DEFAULT: '#3b82f6',
          dim: 'rgba(59,130,246,0.12)',
        },
        success: {
          DEFAULT: '#22c55e',
          dim: 'rgba(34,197,94,0.12)',
        },
        danger: {
          DEFAULT: '#ef4444',
          dim: 'rgba(239,68,68,0.12)',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
