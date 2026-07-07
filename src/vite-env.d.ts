/// <reference types="vite/client" />

// Bridge to the static HTML boot-loading overlay (see index.html) — lets
// BootScene/PreloaderScene report real Loader progress before/while Phaser
// itself has anything to render, avoiding a blank black screen.
interface Window {
  __bootLoading?: {
    setProgress(pct: number, label?: string): void;
    hide(): void;
  };
}
