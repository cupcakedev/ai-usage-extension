import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const ENTRY = '/src/promo/index.html';

const serveEntryAtRoot = (): Plugin => ({
  name: 'promo-entry-at-root',
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const [pathname, search] = (request.url ?? '/').split('?');
      if (pathname === '/' || pathname === '/index.html') {
        request.url = search ? `${ENTRY}?${search}` : ENTRY;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), serveEntryAtRoot()],
  publicDir: resolve(__dirname, 'public'),
  server: { port: 5199, strictPort: false, open: ENTRY },
  resolve: {
    alias: {
      '@sidepanel': resolve(__dirname, 'src/sidepanel'),
      '@background': resolve(__dirname, 'src/background'),
      '@content': resolve(__dirname, 'src/content'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
