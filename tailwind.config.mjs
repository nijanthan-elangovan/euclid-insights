/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        euclid: {
          teal: '#0AB3B3',
          'teal-dark': '#014745',
          'teal-deep': '#087F7F',
          cyan: '#D3FFFE',
          navy: '#273171',
          green: '#61CE70',
          pink: '#FFC8C8',
          gray: '#808285',
          'gray-light': '#F7F8FA',
          'gray-dark': '#2D2D2D',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        'roboto-slab': ['Roboto Slab', 'serif'],
      },
    },
  },
  plugins: [],
};
