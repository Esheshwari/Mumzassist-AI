import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../server/routes/api.js';
import { getDb } from '../server/db/client.js';
import { seedDatabase } from '../server/db/seed.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

async function ensureDatabaseReady() {
  if (dbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        await getDb();
        await seedDatabase(false);
        dbInitialized = true;
      } catch (err) {
        console.error('[Vercel Serverless] DB initialization warning:', err);
      }
    })();
  }
  await dbInitPromise;
}

// Middleware to ensure DB connection is initialized
app.use(async (_req, _res, next) => {
  try {
    await ensureDatabaseReady();
  } catch (err) {
    console.error('[Vercel Serverless] Middleware error:', err);
  }
  next();
});

// Support both direct '/api/...' calls and rewritten '/...' calls
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
