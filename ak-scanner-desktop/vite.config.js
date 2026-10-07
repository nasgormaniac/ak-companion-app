import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'strict-production-csp',
      transformIndexHtml(html, context) {
        if (context.server) return html;
        return html
          .replace("style-src 'self' 'unsafe-inline'", "style-src 'self'")
          .replace("connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173", "connect-src 'self'");
      },
    },
  ],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
