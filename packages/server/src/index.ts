import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDb } from './db/index.js';
import { chaptersRouter } from './routes/chapters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = new Hono();

// Dynamic CORS: allow all origins in production
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction
  ? ['*']
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return allowedOrigins[0];
    if (allowedOrigins.includes('*')) return origin;
    if (allowedOrigins.includes(origin)) return origin;
    return allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/health', (c) => {
  return c.text('OK');
});

app.route('/api', chaptersRouter);

// Serve static frontend files (for production deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  // Serve static assets (JS, CSS, images)
  app.use('/assets/*', serveStatic({ root: clientDistPath }));
  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', serveStatic({ root: clientDistPath, path: 'index.html' }));
}

const port = parseInt(process.env.PORT || '3000', 10);

async function start() {
  await initDb();
  console.log(`Server is running on port ${port}${isProduction ? ' (production)' : ''}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

start();
