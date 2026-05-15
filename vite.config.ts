import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CONFIGURACIÓN MÍNIMA - Elimina todos los alias complejos
export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})