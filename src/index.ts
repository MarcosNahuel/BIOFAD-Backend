import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import pacientesRouter from './routes/pacientes';
import ordenesRouter from './routes/ordenes';
import determinacionesRouter from './routes/determinaciones';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet());

// CORS - Configuración para producción y desarrollo
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  process.env.CORS_ORIGIN, // URL principal (EasyPanel, Vercel, etc.)
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is allowed or matches deployment patterns
    const isAllowed = allowedOrigins.some(allowed =>
      origin === allowed ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.easypanel.host')
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Parser JSON
app.use(express.json());

// Health check (sin auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas API (con autenticación)
// Comentar authMiddleware temporalmente para desarrollo sin auth
app.use('/api/pacientes', /* authMiddleware, */ pacientesRouter);
app.use('/api/ordenes', /* authMiddleware, */ ordenesRouter);
app.use('/api/determinaciones', /* authMiddleware, */ determinacionesRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 BIOFAD Backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
