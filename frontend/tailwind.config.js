/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D3748',      // Dark gray-blue
        secondary: '#4A5568',     // Medium gray
        accent: '#718096',        // Light gray
        bg: '#FAFAFA',            // Off-white
        surface: '#FFFFFF',        // White
        text: '#1A202C',          // Dark text
        'text-light': '#718096',  // Light text
        border: '#E2E8F0',        // Subtle borders
        error: '#E53E3E',         // Error
        success: '#38A169',       // Success
      },
    },
  },
  plugins: [],
};
