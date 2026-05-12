/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        romero: {
          yellow: '#FFD60A',
          'yellow-soft': '#FFE45C',
          'yellow-deep': '#E6BE00',
          ink: '#0B0B0B',
          gray: '#F4F4F5',
          'gray-2': '#E4E4E7',
          'gray-3': '#A1A1AA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sheet: '0 10px 40px -10px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
}
