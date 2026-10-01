import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { backupDatabase } from './utils/backup';
import { startCartReminderWorker } from './workers/cartReminderWorker';

// Load .env and .env.example file if present before loading routes/auth
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.substring(0, idx).trim();
          const value = trimmed.substring(idx + 1).trim();
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.example'));

async function startServer() {
  if (process.env.NODE_ENV === 'production' && process.env.PREVIEW_IFRAME_MODE === 'true') {
    console.warn(
      '[SECURITY WARNING] PREVIEW_IFRAME_MODE=true is enabled while running in production! This flag is disabled automatically for security.'
    );
  }

  const appServer = (await import('./appServer')).default;
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Mount API routes from appServer FIRST
  app.use(appServer);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Serve index.html transformed by Vite for all non-API SPA routes
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return res.status(404).json({ success: false, error: 'API route not found' });
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ success: false, error: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LOST CAMP Server running on http://0.0.0.0:${PORT}`);
    
    // Initial database backup on start and schedule daily backups (every 24h)
    backupDatabase();
    setInterval(backupDatabase, 24 * 60 * 60 * 1000);

    // Start background worker for abandoned cart reminders
    startCartReminderWorker();
  });
}

startServer();


