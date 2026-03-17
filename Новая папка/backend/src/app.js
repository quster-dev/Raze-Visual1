import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientJarPath = path.resolve(__dirname, '../client.jar');
const fabricApiJarPath = path.resolve(__dirname, '../fabric-api-0.141.3-1.21.11.jar');

export function createApp({ clientOrigin }) {
  const app = express();
  const allowedOrigins = Array.isArray(clientOrigin)
    ? clientOrigin
    : String(clientOrigin || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/', (_req, res) => {
    res.json({
      name: 'Maven API',
      version: '1.0.0',
      endpoints: ['/api/health', '/api/content', '/api/contact', '/api/newsletter']
    });
  });

  app.get('/client.jar', (_req, res) => {
    return res.sendFile(clientJarPath);
  });

  app.get('/fabric-api-0.141.3-1.21.11.jar', (_req, res) => {
    return res.sendFile(fabricApiJarPath);
  });

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
