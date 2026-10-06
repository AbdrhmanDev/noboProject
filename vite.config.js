import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Strips the Google Fonts <link>/<preconnect> tags from the built index.html for a SelfHosted
// build only -- Cloud keeps them exactly as before. No local font files exist in this repo to
// substitute (checked), and the existing font-family stack in src/index.css already falls back to
// 'system-ui, sans-serif', so removing the CDN link is enough on its own; nothing was downloaded.
function stripGoogleFontsForSelfHosted(deploymentMode) {
  return {
    name: 'strip-google-fonts-for-selfhosted',
    transformIndexHtml(html) {
      if (deploymentMode !== 'SelfHosted') return html
      return html.replace(/\s*<link[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\n?/g, '')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In dev the browser talks to this server and /api is forwarded to the real backend, so the
  // httpOnly refresh cookie is first-party and survives a page refresh (cross-site cookies get
  // blocked by browsers, which logged the user out on every reload).
  const apiTarget = env.VITE_API_PROXY_TARGET || 'https://nobo-fjm7.onrender.com'

  return {
    plugins: [react(), tailwindcss(), basicSsl(), stripGoogleFontsForSelfHosted(env.VITE_DEPLOYMENT_MODE)],
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
