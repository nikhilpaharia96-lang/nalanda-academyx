/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1F3A",
          light: "#132A4D",
          dark: "#071527",
        },
        academic: {
          DEFAULT: "#1E4C8A",
          light: "#2E63AB",
        },
        gold: {
          DEFAULT: "#C9A227",
          light: "#E0BE55",
          dark: "#9C7D1B",
        },
        neutral: {
          50: "#F7F8FA",
          100: "#F4F6F8",
          200: "#E7EAEF",
          300: "#D3D8E0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
