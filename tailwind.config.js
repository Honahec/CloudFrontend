/** @type {import('tailwindcss').Config} */
const semanticColor = (variable) => `rgb(var(${variable}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          100: '#f3effa',
          200: '#ede4f7',
          300: '#d7c8ee',
          400: '#e8dff5',
          500: '#b699df',
          600: '#9a72d3',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          100: '#e8f6ee',
          500: '#2f8f60',
          600: '#277350',
        },
        warning: {
          100: '#fff3e6',
          500: '#d97706',
          600: '#b65c02',
        },
        error: {
          100: '#feeceb',
          500: '#dc2626',
          600: '#b91c1c',
        },
        info: {
          100: '#e7f2ff',
          500: '#2563eb',
          600: '#1d4ed8',
        },
        surface: {
          DEFAULT: semanticColor('--color-surface'),
          muted: semanticColor('--color-surface-muted'),
          inverted: semanticColor('--color-surface-inverted'),
        },
        text: {
          DEFAULT: semanticColor('--color-text-primary'),
          subtle: semanticColor('--color-text-secondary'),
          inverted: semanticColor('--color-text-inverted'),
        },
        border: {
          DEFAULT: semanticColor('--color-border'),
          strong: semanticColor('--color-border-strong'),
        },
        focus: semanticColor('--color-focus-ring'),
      },
      borderRadius: {
        xl: '16px',
      },
    },
  },
  plugins: [],
}
