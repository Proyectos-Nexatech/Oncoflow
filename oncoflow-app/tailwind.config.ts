import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(211, 87%, 36%)',
          light: 'hsl(211, 87%, 50%)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'hsl(158, 75%, 36%)',
          light: 'hsl(158, 75%, 45%)',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: 'hsl(36, 84%, 50%)',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: 'hsl(0, 64%, 52%)',
          foreground: '#ffffff',
        },
        sidebar: {
          DEFAULT: 'hsl(215, 40%, 10%)',
          foreground: 'hsl(0, 0%, 90%)',
          muted: 'hsl(215, 30%, 18%)',
          accent: 'hsl(211, 87%, 36%)',
          border: 'hsl(215, 30%, 15%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.625rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'sidebar': '4px 0 24px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in': 'slideInLeft 0.3s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
