import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
		plugins: [
			react(),
			webExtension({
				disableAutoLaunch: true,
				additionalInputs: ['src/welcome.html'],
			}),
		],
	build:
		mode === 'development'
			? {
					// Extension pages can load their module preloads in a different
					// execution world than the popup. Dynamic imports still work, but
					// Chromium reports a misleading cross-world preload warning.
					modulePreload: false,
					watch: {
						chokidar: {
							usePolling: true,
							interval: 1000,
						},
					},
				}
			: { modulePreload: false },
	resolve: {
		alias: {
			'@sidepanel': resolve(__dirname, 'src/sidepanel'),
			'@background': resolve(__dirname, 'src/background'),
			'@content': resolve(__dirname, 'src/content'),
			'@shared': resolve(__dirname, 'src/shared'),
			'@welcome': resolve(__dirname, 'src/welcome'),
		},
	},
}));
