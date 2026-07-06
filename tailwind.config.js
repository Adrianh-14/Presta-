/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#eef3f8',
          100: '#d4e0ed',
          200: '#a6bbd1',
          300: '#7896b5',
          400: '#476788',
          500: '#0b3558',
          600: '#092b47',
          700: '#072139',
          800: '#05172a',
          900: '#030e1c',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#b0d4ff',
          300: '#6eb4ff',
          400: '#2b92ff',
          500: '#006bff',
          600: '#0058d4',
          700: '#0044a8',
          800: '#003383',
          900: '#00226b',
        },
        slate: {
          50: '#f8f9fb',
          100: '#e7edf6',
          200: '#d4e0ed',
          300: '#a6bbd1',
          400: '#7896b5',
          500: '#476788',
          600: '#3a5570',
          700: '#2d4258',
          800: '#203040',
          900: '#132028',
        },
        surface: {
          canvas: '#f8f9fb',
          card: '#ffffff',
          fill: '#eef3f8',
          hover: '#e7edf6',
          border: '#d4e0ed',
        },
        success: {
          50: '#ecfdf5',
          500: '#059669',
          600: '#047857',
          700: '#065f46',
        },
        warning: {
          50: '#fffbeb',
          500: '#d97706',
          600: '#b8610c',
          700: '#92400e',
        },
        danger: {
          50: '#fef2f2',
          500: '#dc2626',
          600: '#b91c1c',
        },
      },
      boxShadow: {
        'card': 'rgba(71, 103, 136, 0.04) 0px 4px 5px 0px, rgba(71, 103, 136, 0.03) 0px 4px 10px 0px, rgba(71, 103, 136, 0.05) 0px 10px 20px 0px',
        'card-lg': 'rgba(71, 103, 136, 0.04) 0px 4px 5px 0px, rgba(71, 103, 136, 0.03) 0px 8px 15px 0px, rgba(71, 103, 136, 0.08) 0px 30px 50px 0px',
        'btn': 'rgba(71, 103, 136, 0.04) 0px 4px 5px 0px, rgba(71, 103, 136, 0.03) 0px 8px 15px 0px, rgba(71, 103, 136, 0.06) 0px 15px 30px 0px',
      },
      borderRadius: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        'full': '50px',
      },
    },
  },
  plugins: [],
}
