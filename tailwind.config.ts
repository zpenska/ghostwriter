import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Radio Grotesk', 'system-ui', 'sans-serif'],
        'radio': ['Radio Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand Colors - Explicitly defined for Tailwind
        'brand': {
          'dark': '#1E1E1E',      // Main background for auth and sidebar
          'white': '#FFFFFF',     // White
          'nimbus': '#F5F5F1',    // Page backgrounds
          'yellow': '#d4c57f',    // Muted yellow
          'lavender': '#8a7fae',  // Muted lavender
          'forest': '#3a4943',    // Deep forest green-gray
          'beige': '#a88868',     // Warm beige/tan
          'mint': '#b9cab3',      // Pale mint
          'slate': '#3d3d3c',     // Slate gray
        },
        // Badge/Alert Colors
        'badge': {
          'swift': '#DFFC95',     // Swift badge
          'neural': '#D3C5E8',    // Neural badge
          'scrub': '#BAE5D6',     // Scrub badge
        },
        // Semantic colors using brand palette
        primary: {
          DEFAULT: '#8a7fae',     // Lavender for primary actions
          50: '#f5f3ff',
          100: '#ede9fe', 
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8a7fae',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        secondary: {
          DEFAULT: '#3a4943',     // Forest for secondary
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0', 
          300: '#86efac',
          400: '#4ade80',
          500: '#3a4943',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          DEFAULT: '#d4c57f',     // Yellow for accents
          50: '#fefce8',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d4c57f',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        muted: {
          DEFAULT: '#F5F5F1',     // Nimbus for muted backgrounds
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        text: {
          primary: '#3d3d3c',     // Slate for primary text
          secondary: '#3a4943',   // Forest for secondary text
          muted: '#a88868',       // Beige for muted text
        }
      },
      backgroundColor: {
        'auth': '#1E1E1E',        // Auth background
        'sidebar': '#1E1E1E',     // Sidebar background
        'page': '#F5F5F1',        // Page background
      },
      textColor: {
        'brand-primary': '#3d3d3c',
        'brand-secondary': '#3a4943', 
        'brand-muted': '#a88868',
      },
      borderColor: {
        'brand-primary': '#8a7fae',
        'brand-secondary': '#3a4943',
      },
      ringColor: {
        'brand-primary': '#8a7fae',
        'brand-secondary': '#3a4943',
      },
      backgroundImage: {
        'auth-bg': "url('/auth-background.jpg')",
      },
    },
  },
  plugins: [],
  // Ensure custom colors are available
  safelist: [
    'bg-[#8a7fae]',
    'bg-[#3a4943]', 
    'bg-[#d4c57f]',
    'bg-[#F5F5F1]',
    'bg-[#1E1E1E]',
    'bg-[#D3C5E8]',
    'bg-[#DFFC95]',
    'bg-[#BAE5D6]',
    'text-[#3d3d3c]',
    'text-[#3a4943]',
    'text-[#a88868]',
    'border-[#8a7fae]',
    'ring-[#8a7fae]',
    'hover:bg-[#3a4943]',
    'hover:bg-[#F5F5F1]',
    'focus:ring-[#8a7fae]',
  ],
};

export default config;