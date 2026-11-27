import express from 'express';
import cors from 'cors';
import { authRouter } from './routes-auth.js';
import { shopRouter } from './routes-shop.js';
import { accountRouter } from './routes-account.js';
import { adminRouter } from './routes-admin.js';
import { optionalAuth } from './auth.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(optionalAuth);

  app.get('/api/health', (_req, res) => res.json({ ok: true, brand: 'SOLEVA' }));
  app.use('/api/auth', authRouter);
  app.use('/api', shopRouter);
  app.use('/api', accountRouter);
  app.use('/api/admin', adminRouter);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });
  return app;
}

// Local dev entry (Netlify uses netlify/functions/api.ts instead).
if (process.env.SOLEVA_LOCAL === '1' && process.env.SOLEVA_PROD !== '1') {
  const port = +(process.env.PORT || 8787);
  createApp().listen(port, () => console.log(`SOLEVA API on :${port}`));
}
