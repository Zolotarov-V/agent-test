/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Frutiger', 'Inter', 'ui-sans-serif', 'system-ui'],
        frutiger: ['Frutiger', 'sans-serif'],
      },
      colors: {
        surface: {
          base: 'var(--surface-base)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
          elevated: 'var(--surface-elevated)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          'primary-soft': 'var(--brand-primary-soft)',
          secondary: 'var(--brand-secondary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          accent: 'var(--text-accent)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
          strong: 'var(--border-strong)',
          accent: 'var(--border-accent)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        raised: 'var(--shadow-raised)',
        pressed: 'var(--shadow-pressed)',
        soft: 'var(--shadow-soft)',
        glow: 'var(--shadow-glow)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
}
