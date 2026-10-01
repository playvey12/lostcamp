import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const PORT = Number(env.PORT || process.env.PORT) || 3000;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: PORT,
      hmr: false,
    },
  };
});
