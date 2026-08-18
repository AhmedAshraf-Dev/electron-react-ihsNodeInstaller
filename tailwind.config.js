/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "var(--base-accent)",
        text: "var(--base-text-color)",
        bg: "var(--base-bg)",
        border: "var(--base-border-color)",
      },
      borderRadius: {
        base: "var(--base-border-radius)",
      },
    },
  },
  plugins: [],
};
