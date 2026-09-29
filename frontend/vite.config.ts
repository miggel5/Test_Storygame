import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The generated story (scenes + RLE art, ~1.4 MB, ~160 kB gzipped) is its own lazily loaded chunk.
    chunkSizeWarningLimit: 1600,
  },
})
