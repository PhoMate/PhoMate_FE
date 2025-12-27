import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://api.phomate.site'),
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify('40861042746-o5d7f57400qhfdc8kf7ee76u22jovb0s.apps.googleusercontent.com'),
    'import.meta.env.VITE_GOOGLE_REDIRECT_URI': JSON.stringify('http://localhost:5173/oauth/google/callback'),
  },
});