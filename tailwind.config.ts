import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        primary: "#3BC9FF",
        surface: "#07111f",
        panel: "#0b1526",
        border: "#1e293b",
        muted: "#94a3b8",
      },
      borderRadius: {
        xl: "16px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59, 201, 255, 0.16), 0 24px 80px rgba(0, 0, 0, 0.32)",
      },
    },
  },
  plugins: [],
};

export default config;
