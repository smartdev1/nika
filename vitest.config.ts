import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Phaser nécessite un environnement DOM (window, document, etc.)
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // phaser3spectorjs est un module optionnel de débogage WebGL de Phaser,
      // non requis pour les tests unitaires.
      'phaser3spectorjs': path.resolve(__dirname, 'tests/mocks/empty-module.js'),
    },
  },
});
