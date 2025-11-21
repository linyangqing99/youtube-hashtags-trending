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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#f20d0d",
        "background-light": "#f8f5f5",
        "background-dark": "#181818",
        "surface-dark": "#282828",
        "heatmap-low": "#fee2e2",
        "heatmap-medium": "#f87171",
        "heatmap-hot": "#dc2626",
        "heatmap-very-hot": "#991b1b",
        "dark-heatmap-low": "rgba(254, 226, 226, 0.2)",
        "dark-heatmap-medium": "rgba(248, 113, 113, 0.4)",
        "dark-heatmap-hot": "rgba(220, 38, 38, 0.6)",
        "dark-heatmap-very-hot": "rgba(153, 27, 27, 0.8)",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config;
