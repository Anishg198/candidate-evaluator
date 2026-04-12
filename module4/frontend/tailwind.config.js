export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #020203 100%)',
      },
    },
  },
  plugins: [],
}
