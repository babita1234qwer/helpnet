import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),    tailwindcss()
],
  server: {
    proxy: {
      // Proxy all requests starting with /emergencies to your backend
      '/emergencies': {
        target: 'http://localhost:3001', // Change to your backend port
        changeOrigin: true,
      },        secure: false,

      // Add other API routes if needed
      '/user': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }

      

})
