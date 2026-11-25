/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: "#FCFCFA",
          100: "#F7F6F2",
          200: "#EFECE4",
          300: "#E5E1D6",
          400: "#D3CDC0",
        },
        sage: {
          50: "#F4F6F3",
          100: "#E5EBE3",
          200: "#C8D5C4",
          600: "#4A6153",
          700: "#364A3E",
          800: "#26352C",
          900: "#1A241E",
        },
        stone: {
          border: "#E2DDD5",
          muted: "#8C867A",
        },
        champagne: {
          DEFAULT: "#C5A880",
          light: "#EADDCB",
        },
        drafting: {
          dark: "#0B0F17",
          card: "#131926",
          border: "#1E293B",
          accent: "#2563EB",
          amber: "#F59E0B"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "Courier New", "monospace"],
      }
    },
  },
  plugins: [],
}
