import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F62FE",
          dark: "#0043CE",
          light: "#D0E2FF",
        },
      },
    },
  },
  plugins: [],
};
export default config;
