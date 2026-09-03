export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F766E',
        secondary: '#14B8A6',
        accent: '#2563EB',
        surface: '#ffffff',
        background: '#F8FAFC'
      },
      boxShadow: {
        soft: '0 30px 80px rgba(15, 118, 110, 0.12)',
        glow: '0 0 0 1px rgba(37, 99, 235, 0.06), 0 30px 50px rgba(15, 118, 110, 0.08)'
      },
      borderRadius: {
        xl: '24px'
      },
      keyframes: {
        wave: {
          '0%': { transform: 'rotate(0.0deg)' },
          '10%': { transform: 'rotate(14.0deg)' },
          '20%': { transform: 'rotate(-8.0deg)' },
          '30%': { transform: 'rotate(14.0deg)' },
          '40%': { transform: 'rotate(-4.0deg)' },
          '50%': { transform: 'rotate(10.0deg)' },
          '60%': { transform: 'rotate(0.0deg)' },
          '100%': { transform: 'rotate(0.0deg)' },
        }
      },
      animation: {
        wave: 'wave 2s infinite'
      }
    }
  },
  plugins: []
};
