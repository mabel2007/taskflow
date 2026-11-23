
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Encaminha as requisições da API para o Express.
    proxy: {
      "/api": "http://localhost:3000",
    },

    // Política de segurança aplicada à página no desenvolvimento.
    headers: {
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self' ws://localhost:5173",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; "),
    },
  },
});
