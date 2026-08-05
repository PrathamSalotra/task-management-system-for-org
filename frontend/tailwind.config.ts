import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--canvas)',
        surface: 'var(--surface)',
        primary: {
          500: '#6366f1',
          600: '#4f46e5',
        },
        canvas: 'var(--canvas)',
        'surface-card': 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        'border-subtle': 'var(--border-subtle)',
        status: {
          todo: {
            bg: 'var(--status-todo-bg)',
            text: 'var(--status-todo-text)',
          },
          'in-progress': {
            bg: 'var(--status-in-progress-bg)',
            text: 'var(--status-in-progress-text)',
          },
          completed: {
            bg: 'var(--status-completed-bg)',
            text: 'var(--status-completed-text)',
          },
        },
        priority: {
          low: {
            bg: 'var(--priority-low-bg)',
            text: 'var(--priority-low-text)',
          },
          medium: {
            bg: 'var(--priority-medium-bg)',
            text: 'var(--priority-medium-text)',
          },
          high: {
            bg: 'var(--priority-high-bg)',
            text: 'var(--priority-high-text)',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
};
export default config;
