import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function catalogSavePlugin() {
  return {
    name: 'catalog-save',
    configureServer(server) {
      server.middlewares.use('/api/save-catalog', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const items = JSON.parse(Buffer.concat(chunks).toString());
            const filePath = resolve(process.cwd(), 'src/data/catalog-items.json');
            await writeFile(filePath, JSON.stringify(items, null, 2));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            console.error('[catalog-save]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/landscape-estimator/',
  plugins: [
    react(),
    tailwindcss(),
    catalogSavePlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Landscape Estimator',
        short_name: 'Estimator',
        description: 'Landscape job estimating tool',
        theme_color: '#166534',
        background_color: '#166534',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: 'pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',           sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
