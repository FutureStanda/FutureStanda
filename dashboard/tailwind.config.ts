// Tailwind v4 uses CSS-based configuration in globals.css via @theme.
// This file exists for tooling compatibility (IDE autocomplete, etc.).
// All actual token definitions live in src/app/globals.css.
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
        lime: "#CFFF3A",
        "lime-soft": "#CFFF3A33",
        bg: "#0a0b0a",
        "bg-1": "#111211",
        "bg-2": "#181918",
        "bg-3": "#1f201f",
        "bg-hover": "#1d1e1d",
        "bg-active": "#232423",
        border: "#2a2c2a",
        "border-strong": "#3a3c3a",
        text: "#e8eae8",
        "text-2": "#9a9e9a",
        "text-3": "#6a6e6a",
        red: "#FF5F5F",
        amber: "#FFB347",
        blue: "#5BCEFA",
        violet: "#8B7CFF",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Mono", "ui-monospace", "monospace"],
      },
      spacing: {
        sidebar: "220px",
        topbar: "52px",
        row: "44px",
        "pad-x": "22px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        lime: "0 0 40px #CFFF3A30",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 1px rgba(0,0,0,0.2)",
        modal: "0 8px 32px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
