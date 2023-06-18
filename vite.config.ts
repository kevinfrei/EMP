import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload();
        },
      },
    ]),
    renderer({
      resolve: { module: { type: 'esm' } },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        about: path.resolve(__dirname, 'about.html'),
      },
    },
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: /^@freik\/elect-render-utils$/,
        replacement: `${path.resolve('../EMP/packages/erenderer')}`,
      },
      {
        find: /^@freik\/elect-main-utils$/,
        replacement: `${path.resolve('../EMP/packages/emain')}`,
      },
      {
        find: /^@freik\/electron-renderer$/,
        replacement: `${path.resolve('../EMP/packages/epreload')}`,
      },
    ],
  },
});
