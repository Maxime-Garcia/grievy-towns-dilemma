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
        // Fonction, pas objet : Vite 8/rolldown rejette la forme objet
        // ("manualChunks is not a function") — l'ancienne forme rollup marchait
        // encore avec vite 5, mais plus avec le backend rolldown de vite 8.
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) return 'phaser';
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
