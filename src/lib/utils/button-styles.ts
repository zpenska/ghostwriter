// src/lib/utils/button-styles.ts
// Button styles based on your Ghostwriter design system and brand colors

export const buttonStyles = {
  // Primary button - Muted lavender (#8a7fae)
  primary: 'inline-flex items-center justify-center rounded-md bg-[#8a7fae] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#3a4943] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors duration-200',
  
  // Secondary button - White with border
  secondary: 'inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#3d3d3c] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-[#F5F5F1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors duration-200',
  
  // Tertiary button - Text only
  tertiary: 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-[#8a7fae] hover:bg-[#8a7fae]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors duration-200',
  
  // Danger button - For destructive actions
  danger: 'inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors duration-200',
  
  // Success button - For positive actions
  success: 'inline-flex items-center justify-center rounded-md bg-[#3a4943] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#8a7fae] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3a4943] transition-colors duration-200',
  
  // Icon button - For icon-only buttons
  icon: 'inline-flex items-center justify-center rounded-md p-2 text-[#3d3d3c] hover:bg-[#F5F5F1] hover:text-[#8a7fae] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors duration-200',
  
  // Small variants
  primarySmall: 'inline-flex items-center justify-center rounded-md bg-[#8a7fae] px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#3a4943] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors duration-200',
  
  secondarySmall: 'inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#3d3d3c] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-[#F5F5F1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors duration-200',
  
  // Large variants
  primaryLarge: 'inline-flex items-center justify-center rounded-md bg-[#8a7fae] px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#3a4943] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors duration-200',
  
  secondaryLarge: 'inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-base font-semibold text-[#3d3d3c] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-[#F5F5F1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors duration-200',
  
  // Disabled states
  primaryDisabled: 'inline-flex items-center justify-center rounded-md bg-gray-300 px-3 py-2 text-sm font-semibold text-gray-500 shadow-sm cursor-not-allowed',
  
  secondaryDisabled: 'inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-400 shadow-sm ring-1 ring-inset ring-gray-200 cursor-not-allowed',
};