/**
 * Local Development Server
 *
 * This file is used for local development only. In production (Vercel),
 * the api/index.js file is used instead as a serverless function.
 *
 * Usage:
 * - Development: npm run dev (uses nodemon for auto-reload)
 * - Local production test: npm start
 *
 * The Express app is exported for potential use in testing,
 * but the main purpose is to run a local development server.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import responseRoutes from './routes/responses.js';
import adminRoutes from './routes/admin.js';
import questionnaireRoutes from './routes/questionnaires.js';
import fileUploadRoutes from './routes/file-upload.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS - Allow frontend access during local development
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers - Handle JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EUDA Backend API is running (Local Development)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
app.use('/api/file-upload', fileUploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EUDA Questionnaire Backend API',
    version: '1.0.0',
    environment: 'Local Development',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      questionnaires: '/api/questionnaires',
      responses: '/api/responses',
      admin: '/api/admin',
      fileUpload: '/api/file-upload'
    }
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==========================================
// START SERVER (Local Development Only)
// ==========================================

// Only start the server if not in production (Vercel uses serverless functions)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 EUDA Backend Server Started');
    console.log('========================================');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📍 Network: http://0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
    console.log('========================================');
    console.log('Available endpoints:');
    console.log(`  GET  /health`);
    console.log(`  POST /api/auth/login`);
    console.log(`  POST /api/auth/register`);
    console.log(`  GET  /api/questionnaires`);
    console.log(`  GET  /api/responses`);
    console.log(`  GET  /api/admin/*`);
    console.log('========================================');
  });
}

// Export app for testing purposes
export default app;
