import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        koperasi: { red: "#C62828", darkred: "#8E1B1B", gold: "#F9A825", cream: "#FFF8E1" }
      }
    }
  },
  plugins: []
};
export default config;
