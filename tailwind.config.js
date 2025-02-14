/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        background: {
          dark: '#1E1E1E',
          light: '#F8F8F8',
        },
        text: {
          dark: '#F2F2F2',
          light: '#1D1D1D',
        },
        coral: {
          DEFAULT: '#F2994A',
          hover: '#D87C3A',
          50: '#FEF2E9',
          100: '#FDE4D3',
          200: '#FBC9A7',
          300: '#F9AE7B',
          400: '#F6934F',
          500: '#F2994A',
          600: '#E07B24',
          700: '#B8651E',
          800: '#904F17',
          900: '#683911',
        },
        teal: {
          DEFAULT: '#00BFA5',
          50: '#E6FBF8',
          100: '#CCF7F1',
          200: '#99EFE3',
          300: '#66E7D5',
          400: '#33DFC7',
          500: '#00BFA5',
          600: '#009B86',
          700: '#007766',
          800: '#005347',
          900: '#002E27',
        },
        status: {
          error: '#EB5757',
          warning: '#F2C94C',
          success: '#27AE60',
        },
        border: {
          dark: '#333333',
          light: '#E2E2E2',
        },
      },
      fontSize: {
        h1: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }], // 36px
        h2: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600' }], // 30px
        h3: ['1.5rem', { lineHeight: '2rem', fontWeight: '500' }], // 24px
        base: ['1rem', { lineHeight: '1.5rem' }], // 16px
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}