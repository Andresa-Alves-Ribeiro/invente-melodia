/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Righteous"', 'cursive'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        stage: {
          ink: '#0b0614',
          panel: '#15102a',
          line: '#2d2654',
          gold: '#f4d03f',
          mint: '#5eead4',
          rose: '#fb7185',
        },
      },
      boxShadow: {
        arcade:
          '0 0 0 3px rgba(244,208,63,0.35), 0 6px 0 #0b0614, 0 10px 28px rgba(0,0,0,0.5)',
        'arcade-inset': 'inset 0 2px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
};
