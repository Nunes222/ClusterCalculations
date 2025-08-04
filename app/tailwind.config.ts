import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Enables dark mode via 'class'
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        sidebar: "var(--sidebar)",
        accent: "var(--accent)",
        // Add more as needed
      },
    },
  },
  plugins: [],
};

export default config;
