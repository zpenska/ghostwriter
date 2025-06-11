// Button styles based on your Ghostwriter design system and Tailwind Catalyst UI
// Using your specified colors and no emoji/ghost terminology

export const buttonStyles = {
    // Primary button - Muted lavender (#8a7fae)
    primary: 'inline-flex items-center justify-center rounded-md bg-[#8a7fae] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#8a7fae]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a7fae] transition-colors',
    
    // Secondary button - White background with gray border
    secondary: 'inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors',
    
    // Accent yellow button (#d4c57f)
    yellow: 'inline-flex items-center justify-center rounded-md bg-[#d4c57f] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-[#d4c57f]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4c57f] transition-colors',
    
    // Toolbar button - subtle style for editor toolbar
    toolbar: 'inline-flex items-center justify-center rounded p-2 text-gray-700 hover:bg-gray-100 transition-colors',
    
    // Toolbar button active state
    toolbarActive: 'inline-flex items-center justify-center rounded p-2 bg-gray-200 text-gray-900',
    
    // Text button - no background
    text: 'inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors',
    
    // Icon only button
    icon: 'inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 transition-colors',
    
    // Danger button - for destructive actions
    danger: 'inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors',
  };
  
  // These match your color scheme:
  // #1E1E1E - Dark background (sidebar)
  // #F5F5F1 - Nimbus (page background)
  // #d4c57f - Muted yellow
  // #8a7fae - Muted lavender
  // #3a4943 - Deep forest green-gray
  // #a88868 - Warm beige/tan
  // #b9cab3 - Pale mint
  // #3d3d3c - Slate gray