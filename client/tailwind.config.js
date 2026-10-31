/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E293B', dark: '#0F172A' },
        accent: { DEFAULT: '#2F5D8A', dark: '#264C72', soft: '#E8EEF5' },
        surface: { DEFAULT: '#FFFFFF', subtle: '#F1F5F9' },
        border: '#E2E8F0',
        text: { DEFAULT: '#0F172A', secondary: '#475569', muted: '#64748B' },
        success: { DEFAULT: '#2F7D5B', soft: '#E7F3EC' },
        warning: { DEFAULT: '#B7791F', soft: '#FBF3E0' },
        danger: { DEFAULT: '#B4443C', soft: '#F9E8E6' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '12px', input: '8px' },
      boxShadow: {
        subtle: '0 1px 2px rgba(15,23,42,0.06)',
        card: '0 1px 3px rgba(15,23,42,0.08)',
      },
    },
  },
};
