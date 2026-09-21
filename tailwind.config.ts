import type { Config } from "tailwindcss";

/**
 * Colours are driven by CSS custom properties (see globals.css) so the
 * whole public site can swap between light and dark by flipping one
 * attribute on <html>, with no duplicated class names in components.
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy portal brand colours (merchant/driver/admin screens)
        brand: {
          DEFAULT: "#0F62FE",
          dark: "#0043CE",
          light: "#D0E2FF",
        },
        // Semantic, theme-aware tokens used by the public site
        bg: token("--bg"),
        "bg-soft": token("--bg-soft"),
        surface: token("--surface"),
        "surface-2": token("--surface-2"),
        line: token("--line"),
        fg: token("--fg"),
        "fg-muted": token("--fg-muted"),
        "fg-subtle": token("--fg-subtle"),
        accent: {
          DEFAULT: token("--accent"),
          bright: token("--accent-bright"),
          contrast: token("--accent-contrast"),
          solid: token("--accent-solid"),
        },
        live: token("--live"),
        inverse: token("--inverse"),
        "inverse-fg": token("--inverse-fg"),
        // Status colours: `x` for text/icons, `x-soft` for tinted panels,
        // `x-solid` for buttons that carry white text in both themes.
        ok: token("--ok"),
        "ok-soft": token("--ok-soft"),
        "ok-solid": token("--ok-solid"),
        warn: token("--warn"),
        "warn-soft": token("--warn-soft"),
        "warn-solid": token("--warn-solid"),
        danger: token("--danger"),
        "danger-soft": token("--danger-soft"),
        "danger-solid": token("--danger-solid"),
        info: token("--info"),
        "info-soft": token("--info-soft"),
        "info-solid": token("--info-solid"),
        "neutral-solid": token("--neutral-solid"),
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "route-dash": { to: { strokeDashoffset: "-200" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.24,0,0.38,1) infinite",
        "route-dash": "route-dash 3s linear infinite",
        shimmer: "shimmer 2.5s infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
