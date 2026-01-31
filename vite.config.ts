import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Mock /api/alerts -> Environment Canada
      '/api/alerts': {
        target: 'https://api.weather.gc.ca',
        changeOrigin: true,
        secure: false, // Allow self-signed or issues
        rewrite: (path) => '/collections/citypageweather-realtime/items/ns-19?f=json',
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // Impersonate browser
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
            proxyReq.setHeader('Referer', 'https://weather.gc.ca/');
            proxyReq.setHeader('Accept', 'application/xml, text/xml, */*');
          });
        },
      },
      // Mock /api/traffic -> Halifax Harbour Bridges
      '/api/traffic': {
        target: 'https://halifaxharbourbridges.ca',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => '/',
      },
    },
  },
})
