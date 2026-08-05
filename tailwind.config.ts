import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#090B12",
          panel: "#111522",
          card: "#161B2C",
          line: "rgba(255,255,255,0.08)",
          muted: "#B6BAC8"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 45px rgba(144, 76, 255, 0.28)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.45)"
      }
    }
  },
  plugins: []
} satisfies Config;
