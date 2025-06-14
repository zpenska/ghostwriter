import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Using standard Catalyst colors with your specific overrides only where needed
      colors: {
        // Keep your auth background color
        'auth-bg': '#1E1E1E',
        'sidebar-bg': '#1E1E1E', 
        'page-bg': '#F5F5F1',
      },
      backgroundColor: {
        'auth': '#1E1E1E',
        'sidebar': '#1E1E1E',
        'page': '#F5F5F1',
      },
    },
  },
  plugins: [],
};

export default config;