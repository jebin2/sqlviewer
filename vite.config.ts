import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 'base' is crucial for GitHub Pages. 
  // './' ensures assets are loaded relatively (e.g., "assets/script.js" instead of "/assets/script.js")
  base: './', 
  define: {
    // Polyfill process.env to prevent runtime crashes in browser
    'process.env': {},
    // In a real build, you would replace this with actual env var injection
    // 'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  optimizeDeps: {
    exclude: ['sql.js'] // sql.js can sometimes cause optimization issues due to wasm
  }
});