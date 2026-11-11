import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function shrineSecurityHeadersPlugin(): Plugin {
  const applySecurityMiddleware = (middlewares: {
    use: (
      fn: (
        req: { method?: string; headers: Record<string, string | string[] | undefined> },
        res: { setHeader: (k: string, v: string) => void; statusCode: number; end: (b?: string) => void },
        next: () => void
      ) => void
    ) => void;
  }) => {
    middlewares.use((req, res, next) => {
      // Fetch Metadata Resource Isolation (Security §3.7)
      res.setHeader('Vary', 'Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site');
      const site = req.headers['sec-fetch-site'];
      const mode = req.headers['sec-fetch-mode'];
      const dest = req.headers['sec-fetch-dest'];

      if (
        typeof site === 'string' &&
        !['same-origin', 'same-site', 'none'].includes(site) &&
        !(site === 'cross-site' && mode === 'navigate' && req.method === 'GET' && dest !== 'object' && dest !== 'embed')
      ) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      // Companion & Isolation Security Headers (Security §1.4, §3.2, §3.4, §3.5)
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader(
        'Permissions-Policy',
        'camera=(), geolocation=(), microphone=(), focus-without-user-activation=()'
      );
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      res.setHeader(
        'Content-Security-Policy',
        "object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'"
      );

      next();
    });
  };

  return {
    name: 'shrine-security-headers',
    configureServer(server) {
      applySecurityMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      applySecurityMiddleware(server.middlewares);
    }
  };
}

export default defineConfig({
  plugins: [react(), shrineSecurityHeadersPlugin()],
  server: {
    port: 3333,
    open: false,
    proxy: {
      '/api': {
        target: 'https://kamioshi.si',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
