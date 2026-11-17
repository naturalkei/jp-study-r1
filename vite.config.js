import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // Use '/jp-study-r1/' for GitHub Pages deployment under naturalkei/jp-study-r1
  // Can also use relative './' for flexibility across local and preview environments
  base: process.env.GITHUB_ACTIONS ? '/jp-study-r1/' : './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: true,
  },
});
