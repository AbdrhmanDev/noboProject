import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In dev the browser talks to this server and /api is forwarded to the real backend, so the
  // httpOnly refresh cookie is first-party and survives a page refresh (cross-site cookies get
  // blocked by browsers, which logged the user out on every reload).
  const apiTarget = env.VITE_API_PROXY_TARGET || 'https://nobo-fjm7.onrender.com'

  return {
    plugins: [react(), tailwindcss(), basicSsl()],
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: '',
        },
      },
    },
  }
})
