/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        yara: {
          ink: "#2c1c22",
          wine: "#b3124b",
          rose: "#f8dfe7",
          blush: "#fff6f7",
          ivory: "#fffafa",
          gold: "#c89b3c",
          taupe: "#74676b"
        }
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Montserrat", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 60px rgba(95, 50, 63, 0.10)",
        card: "0 12px 38px rgba(123, 78, 88, 0.08)"
      }
    }
  },
  plugins: []
};
