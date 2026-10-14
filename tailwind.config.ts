import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand primary — Indigo
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#3B5BDB',  // main
          700: '#364FC7',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        // Neutrals (Slate)
        gray: {
          25:  '#FCFCFD',
          50:  '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#868E96',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
          950: '#0D0F12',
        },
        // Semantic
        success: {
          50:  '#EBFBEE',
          100: '#D3F9D8',
          500: '#40C057',
          600: '#2F9E44',
          700: '#2B8A3E',
        },
        warning: {
          50:  '#FFF9DB',
          100: '#FFF3BF',
          500: '#FAB005',
          600: '#F08C00',
          700: '#E67700',
        },
        danger: {
          50:  '#FFF5F5',
          100: '#FFE3E3',
          500: '#FA5252',
          600: '#F03E3E',
          700: '#C92A2A',
        },
        // Dark mode surfaces
        dark: {
          bg:     '#0F1117',
          surface: '#1A1D27',
          elevated: '#21253A',
          border: '#2C2F3F',
          muted:  '#3D4158',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xs':  '4px',
        'sm':  '6px',
        DEFAULT: '8px',
        'md':  '10px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'xs':  '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'sm':  '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'md':  '0 4px 16px -2px rgb(0 0 0 / 0.10), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
        'lg':  '0 10px 40px -4px rgb(0 0 0 / 0.12), 0 4px 16px -4px rgb(0 0 0 / 0.08)',
        'xl':  '0 20px 60px -8px rgb(0 0 0 / 0.14)',
        'ring': '0 0 0 3px rgb(59 91 219 / 0.25)',
        'ring-danger': '0 0 0 3px rgb(201 42 42 / 0.25)',
      },
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '72':  '18rem',
        '80':  '20rem',
        '88':  '22rem',
        '96':  '24rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'hint-in': 'hintIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        'dropdown-in': 'dropdownIn 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
        'item-in': 'itemIn 0.25s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        hintIn: {
          '0%': { transform: 'translateY(70%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        dropdownIn: {
          '0%': { transform: 'translateY(-6px) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        itemIn: {
          '0%': { transform: 'translateX(-6px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
export default config
