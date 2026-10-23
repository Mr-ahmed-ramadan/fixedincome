import type { Config } from "tailwindcss";

// Brand colours live as RGB triplets in globals.css so light/dark switch automatically.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  // `dark:` follows the device, unless the visitor picked a theme (data-theme on <html>).
  darkMode: [
    "variant",
    ["@media (prefers-color-scheme: dark) { &:where(:root:not([data-theme=light]) *) }", "&:where([data-theme=dark] *)"],
  ],
  theme: {
    extend: {
      colors: {
        primary: token("primary"),
        accent: token("accent"),
        ink: token("ink"),
        paper: token("paper"),
        card: token("card"),
        muted: token("muted"),
        line: token("line"),
        onprimary: token("onprimary"),
      },
      fontFamily: {
        sans: ["var(--font-stack)"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      maxWidth: {
        site: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
