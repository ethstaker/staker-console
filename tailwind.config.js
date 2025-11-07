/** @type {import('tailwindcss').Config} */
import { tailwindColors } from './src/theme';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  important: '#tailwind-root',
  theme: {
    extend: {
      colors: {
        primary: tailwindColors.primary,
        primaryDark: tailwindColors.primaryDark,
        background: tailwindColors.background,
        divider: tailwindColors.divider,
        secondaryBackground: tailwindColors.secondaryBackground,
        secondaryText: tailwindColors.secondaryText,
        white: tailwindColors.white,
        blue: tailwindColors.blue,
        success: tailwindColors.success,
        error: tailwindColors.error,
        warning: tailwindColors.warning,
      },
      fontSize: {
        '2xs': '0.625rem',
      },
    },
  },
  plugins: [],
}

