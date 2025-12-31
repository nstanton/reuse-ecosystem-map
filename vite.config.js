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
    emptyOutDir: true,
    // Explicitly set target to maintain compatibility with older browsers if needed
    // Vite 7 defaults to 'baseline-widely-available' which targets browsers stable for 30+ months
    // Uncomment and adjust if you need to support older browsers:
    // target: 'modules' // or specific browser targets like ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
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

