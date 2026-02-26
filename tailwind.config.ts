import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        sand: {
          50: '#fefdfb',
          100: '#fdf8f0',
          200: '#f9edd8',
          300: '#f5e0bc',
          400: '#e8c88a',
          500: '#d4a960',
          600: '#b88d44',
          700: '#996f32',
          800: '#7a5728',
          900: '#5c4220',
        },
      },
    },
  },
  plugins: [],
}
export default config
