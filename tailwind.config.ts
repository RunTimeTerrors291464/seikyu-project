import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
        },
        success: "#16a34a",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "12px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.05)",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          lg: "1.5rem",
          xl: "2rem",
        },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};

export default config;
