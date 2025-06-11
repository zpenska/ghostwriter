// Button styles based on your Ghostwriter design system and Tailwind Catalyst UI
// Using your specified colors without ghost/emoji terminology

export const buttonStyles = {
  // Primary button - Muted lavender (#8a7fae)
  primary: 'inline-flex items-center justify-center rounded-md bg-[#8a7fae] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#7a6f9e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Secondary button - using slate gray
  secondary: 'inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#44474F] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Text button - minimal style
  text: 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-[#44474F] hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Icon button - for toolbar icons
  icon: 'inline-flex items-center justify-center rounded p-1 text-[#44474F] hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Toolbar button - for editor toolbar
  toolbar: 'inline-flex items-center justify-center rounded px-2 py-1 text-sm text-[#44474F] hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Danger button - for destructive actions
  danger: 'inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Success button - using deep forest green
  success: 'inline-flex items-center justify-center rounded-md bg-[#2E4A3F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#253e34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4A3F] disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Yellow button - using muted yellow
  yellow: 'inline-flex items-center justify-center rounded-md bg-[#d4c57f] px-3 py-2 text-sm font-semibold text-[#2E4A3F] shadow-sm hover:bg-[#c4b56f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4c57f] disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Purple button - using muted lavender (same as primary)
  purple: 'inline-flex items-center justify-center rounded-md bg-[#8a7fae] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#7a6f9e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] disabled:opacity-50 disabled:cursor-not-allowed',
}