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
        // the one Nestora palette (landing and studio alike)
        paper: "#FAF7F2",
        paper2: "#F2EDE4",
        card: "#FFFFFF",
        ink: "#1F1B16",
        muted: "#6B6358",
        line: "#E6DFD3",
        terra: { DEFAULT: "#B4532A", dark: "#93431F" },
        green: { DEFAULT: "#1F4D45" },
        gold: { DEFAULT: "#C9962B", dark: "#8A6416" },
      },
      fontFamily: {
        sans: ["var(--font-body)", "'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      }
    },
  },
  plugins: [],
}
