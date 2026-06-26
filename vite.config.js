import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Tableau requires 'unsafe-inline' for its embed script injection
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://public.tableau.com 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://public.tableau.com https://*.tableau.com",
    "frame-src https://public.tableau.com",
    "connect-src 'self' https://public.tableau.com",
    "font-src 'self' https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { headers: securityHeaders },
  preview: { headers: securityHeaders },
});
