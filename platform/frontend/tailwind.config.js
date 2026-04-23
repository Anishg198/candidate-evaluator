export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #020203 100%)',
        'app-gradient-light': 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
      },
      colors: {
        accent: '#6366f1',
        'accent-dim': 'rgba(99,102,241,0.15)',
        surface: 'rgba(255,255,255,0.05)',
        'surface-hover': 'rgba(255,255,255,0.08)',
        border: 'rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
}
