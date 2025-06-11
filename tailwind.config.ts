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
        // Main backgrounds
        'auth-bg': '#1E1E1E',
        'sidebar-bg': '#1E1E1E',
        'page-white': '#FFFFFF',
        'page-nimbus': '#F5F5F1',
        
        // Accent colors
        'accent-yellow': '#d4c57f',
        'accent-lavender': '#8a7fae',
        'accent-forest': '#3a4943',
        'accent-beige': '#a88868',
        'accent-mint': '#b9cab3',
        'accent-slate': '#3d3d3c',
        
        // Badge/Alert colors
        'badge-swift': '#DFFC95',
        'badge-neural': '#D3C5E8',
        'badge-scrub': '#BAE5D6',
      },
      fontFamily: {
        'radio': ['Radio Canada', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;