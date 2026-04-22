import type { Config } from 'tailwindcss'
import { colors } from './src/styles/colors'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...colors,
      },
      boxShadow: {
        panel: '0 16px 38px rgba(15, 23, 42, 0.18)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
} satisfies Config
