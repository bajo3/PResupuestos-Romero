import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Identifica cada publicación: el commit de Vercel, o la hora de compilación en local.
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
const APP_VERSION = (env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || `local-${Date.now().toString(36)}`

/** Publica /version.json para que las apps abiertas detecten una versión nueva. */
function versionFile(): Plugin {
  return {
    name: 'version-file',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION }) })
    },
  }
}

export default defineConfig({
  plugins: [react(), versionFile()],
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
})
