import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          1000: "#0E0E0C",
          800: "#2A2A26",
          600: "#5A5A53",
          400: "#989590",
          200: "#D8D5CE",
          100: "#EFECE3",
          50: "#FAF8F2",
        },
        accent: {
          DEFAULT: "#C89060",
        },
        state: {
          claimable: "#6B8E5A",
          error: "#A85A3F",
        },
      },
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Geist Sans", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "Menlo", "monospace"],
      },
      fontSize: {
        display: ["clamp(3rem, 7vw, 5.5rem)", { letterSpacing: "-0.02em", lineHeight: "1.05" }],
        h1: ["clamp(2rem, 4vw, 3rem)", { letterSpacing: "-0.02em", lineHeight: "1.1" }],
        h2: ["1.5rem", { fontWeight: "500", lineHeight: "1.3" }],
        h3: ["1.125rem", { fontWeight: "500", lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        label: ["0.75rem", { fontWeight: "500", letterSpacing: "0.04em" }],
        code: ["0.75rem", { lineHeight: "1.5" }],
      },
      borderWidth: {
        DEFAULT: "1px",
        "0.5": "0.5px",
      },
      borderRadius: {
        pill: "999px",
        card: "12px",
        input: "8px",
        redaction: "2px",
      },
      maxWidth: {
        content: "1200px",
        prose: "64ch",
      },
      spacing: {
        "4": "4px",
        "8": "8px",
        "12": "12px",
        "16": "16px",
        "24": "24px",
        "32": "32px",
        "48": "48px",
        "64": "64px",
        "96": "96px",
      },
      transitionTimingFunction: {
        sealed: "cubic-bezier(0.4, 0, 0.1, 1)",
      },
      transitionDuration: {
        standard: "240ms",
        fast: "180ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms cubic-bezier(0.4, 0, 0.1, 1)",
        "slide-up": "slide-up 240ms cubic-bezier(0.4, 0, 0.1, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
