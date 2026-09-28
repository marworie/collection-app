import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'https://localhost:7133',
        changeOrigin: true,
        secure: false
      }
    }
  }
})