import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core':     resolve(__dirname, 'src/core'),
      '@entities': resolve(__dirname, 'src/entities'),
      '@ui':       resolve(__dirname, 'src/ui'),
      '@audio':    resolve(__dirname, 'src/audio'),
      '@network':  resolve(__dirname, 'src/network'),
      '@systems':  resolve(__dirname, 'src/systems'),
      '@data':     resolve(__dirname, 'src/data'),
    },
  },
  assetsInclude: ['**/*.wav', '**/*.mp3', '**/*.glb', '**/*.babylon'],
  optimizeDeps: {
    include: [
      '@babylonjs/core',
      '@babylonjs/gui',
      '@babylonjs/materials',
      '@babylonjs/loaders',
    ],
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          'babylon-core':  ['@babylonjs/core'],
          'babylon-gui':   ['@babylonjs/gui'],
          'firebase-app':  ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-db':   ['firebase/firestore'],
        },
      },
    },
  },
});
