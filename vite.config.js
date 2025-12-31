import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: 'src',
  envDir: resolve(__dirname), // Look for .env files in project root, not src directory
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        // SCSS options
      }
    }
  },
  base: '', // For GitHub Pages deployment with relative paths
  server: {
    port: 3000,
    open: true
  }
})

