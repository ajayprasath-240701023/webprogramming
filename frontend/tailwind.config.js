/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // TradePilot Dark Trading Terminal Palette
        tp: {
          bg: '#080B12',
          sidebar: '#0D111B',
          card: '#111827',
          'card-hover': '#1a2235',
          border: '#253044',
          'border-light': '#2d3b52',
          accent: '#3B82F6',       // Electric blue
          'accent-hover': '#2563EB',
          positive: '#10B981',     // Emerald green
          'positive-bg': 'rgba(16, 185, 129, 0.1)',
          negative: '#EF4444',     // Soft red
          'negative-bg': 'rgba(239, 68, 68, 0.1)',
          violet: '#8B5CF6',
          'violet-bg': 'rgba(139, 92, 246, 0.1)',
          amber: '#F59E0B',
          'amber-bg': 'rgba(245, 158, 11, 0.1)',
          text: '#F9FAFB',
          'text-secondary': '#9CA3AF',
          'text-muted': '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
      borderRadius: {
        'card': '14px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
