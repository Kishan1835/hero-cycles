/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Industrial palette: deep steel blue (frame/engineering), hot
        // forge red (Hero brand accent, used sparingly for actions/alerts),
        // warm steel grays for structure. Avoids generic SaaS purple/indigo.
        steel: {
          950: '#0b1320',
          900: '#101a2c',
          800: '#16233a',
          700: '#1f3050',
          600: '#2c4267',
          500: '#3e5a87',
          400: '#6b85ab',
          300: '#9aaecb',
          200: '#c6d2e4',
          100: '#e6ecf5',
          50: '#f4f7fb',
        },
        forge: {
          700: '#9c2b1f',
          600: '#c13624',
          500: '#dd4429',
          400: '#e8674a',
        },
        brass: {
          500: '#b8893f',
          400: '#d3a85f',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
