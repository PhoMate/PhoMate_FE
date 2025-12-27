import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    'process.env': {
      VITE_API_BASE_URL: 'https://api.phomate.site',
      VITE_GOOGLE_CLIENT_ID: '40861042746-o5d7f57400qhfdc8kf7ee76u22jovb0s.apps.googleusercontent.com',
      VITE_GOOGLE_REDIRECT_URI: 'http://localhost:5173/oauth/google/callback'
    }
  }
})