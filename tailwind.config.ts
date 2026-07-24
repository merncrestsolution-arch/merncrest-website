import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--stitch-primary)",
          foreground: "#FFFFFF",
        },
        surface: {
          DEFAULT: "var(--stitch-surface-container)",
          foreground: "var(--stitch-on)",
          low: "var(--stitch-surface-low)",
          high: "var(--stitch-surface-high)",
          lowest: "var(--stitch-bg)",
        },
        accent: {
          DEFAULT: "var(--stitch-primary)",
          alt: "var(--stitch-secondary)",
          blue: "#3B82F6",
          glow: "var(--stitch-primary-glow)",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "var(--stitch-muted)",
          foreground: "var(--stitch-outline-strong)",
        },
        border: "hsl(var(--border))",
        glass: "var(--stitch-glass)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        stitch: {
          bg: "var(--stitch-bg)",
          surface: "var(--stitch-surface)",
          low: "var(--stitch-surface-low)",
          on: "var(--stitch-on)",
          muted: "var(--stitch-muted)",
          primary: "var(--stitch-primary)",
          glow: "var(--stitch-primary-glow)",
          outline: "var(--stitch-outline)",
        },
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "44px" }],
        "5xl": ["48px", { lineHeight: "1.1" }],
        "6xl": ["60px", { lineHeight: "72px", letterSpacing: "-0.02em" }],
        "7xl": ["72px", { lineHeight: "1" }],
      },
      maxWidth: {
        stitch: "1440px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-accent":
          "linear-gradient(135deg, #2563eb 0%, #6d28d9 50%, #db2777 100%)",
        "gradient-text":
          "linear-gradient(90deg, #1e40af 0%, #6d28d9 45%, #db2777 78%, #e11d48 100%)",
      },
      boxShadow: {
        glow: "0 0 30px var(--stitch-glow)",
        "glow-lg": "0 0 50px var(--stitch-glow)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee-reverse 40s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        drift: "drift 18s ease-in-out infinite",
        "wave-slow": "wave-slow 12s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
        "pulse-soft": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.9" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(2%, -3%) scale(1.05)" },
        },
        "wave-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
