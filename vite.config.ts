import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vercel 배포 시에는 base를 설정하지 않거나 '/'로 두면 됩니다.
  base: '/', 
  build: {
    outDir: 'dist',
  }
})
