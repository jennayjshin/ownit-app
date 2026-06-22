import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: mode === 'development' ? {
      '@apps-in-toss/web-framework/config': path.resolve(__dirname, 'src/mocks/web-framework-config.ts'),
      '@apps-in-toss/web-framework': path.resolve(__dirname, 'src/mocks/web-framework.ts'),
    } : {},
  },
}))
