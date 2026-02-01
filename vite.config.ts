import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Define process.env to prevent 'process is not defined' errors in browser
    'process.env': {}
  },
  base: './', // Use relative paths for GitHub Pages deployment
});