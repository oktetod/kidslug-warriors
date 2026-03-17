import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // Explicitly tell Vite the project root (where index.html lives)
  root: path.resolve(__dirname, '.'),

  // base must be './' for WebToAPK / file:// loading, NOT '/'
  base: './',

  build: {
    outDir:  path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          phaser:   ['phaser'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },

  assetsInclude: ['**/*.wav', '**/*.mp3', '**/*.ogg'],
});
