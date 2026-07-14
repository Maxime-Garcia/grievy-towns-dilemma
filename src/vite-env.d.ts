/// <reference types="vite/client" />

/**
 * Hash court du commit compilé, substitué à la compilation par Vite
 * (`define` dans vite.config.ts). Suffixé `-dirty` si l'arbre de travail portait
 * des modifications non committées, `nogit` hors dépôt.
 * Consommé par le badge de build de UIScene.
 */
declare const __BUILD_HASH__: string;

// Bridge to the static HTML boot-loading overlay (see index.html) — lets
// BootScene/PreloaderScene report real Loader progress before/while Phaser
// itself has anything to render, avoiding a blank black screen.
interface Window {
  __bootLoading?: {
    setProgress(pct: number, label?: string): void;
    hide(): void;
  };
}
