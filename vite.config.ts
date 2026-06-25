import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // GitHub Pages requires the repo name as base path; locally './' is fine
  base: process.env.GITHUB_ACTIONS ? '/grievy-towns-dilemma/' : './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
