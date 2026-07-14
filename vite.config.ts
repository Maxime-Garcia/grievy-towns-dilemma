import { defineConfig } from 'vite';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Hash du commit courant, injecté à la compilation dans `__BUILD_HASH__`
 * (cf. UIScene.BUILD_LABEL, le badge vert de dev).
 *
 * Il était écrit À LA MAIN dans UIScene, et c'était structurellement faux : le
 * hash n'est connu qu'APRÈS le commit, or l'écrire dans le code modifie le
 * commit — donc le hash. Chaque badge portait le hash d'une version aussitôt
 * remplacée, introuvable dans l'historique. Un badge censé identifier la build
 * ne peut pas être maintenu à la main : il doit être DÉRIVÉ.
 *
 * `-dirty` quand l'arbre de travail a des modifications non committées : le badge
 * dit alors franchement que ce qui tourne ne correspond à aucun commit.
 */
function buildHash(): string {
  try {
    const hash  = execSync('git rev-parse --short HEAD').toString().trim();
    const dirty = execSync('git status --porcelain').toString().trim().length > 0;
    return dirty ? `${hash}-dirty` : hash;
  } catch {
    return 'nogit'; // archive sans .git : on n'empêche pas le build pour un badge
  }
}

export default defineConfig({
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash()),
  },
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
          if (id.includes('node_modules/phaser/')) return 'phaser';
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
