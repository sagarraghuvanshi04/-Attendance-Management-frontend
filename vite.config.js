import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    middlewareMode: false,
  }
})
