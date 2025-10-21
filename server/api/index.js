/**
 * Vercel Serverless Function Handler
 *
 * This is the main entry point for all API requests in the Vercel serverless environment.
 * It wraps an Express application using serverless-http to handle HTTP requests/responses.
 *
 * Architecture:
 * - All routes are imported from ../src/routes/
 * - Express app is configured with CORS, JSON parsing, and error handling
 * - The app is wrapped with serverless-http for compatibility with Vercel's runtime
 *
 * Best Practices:
 * - Environment variables are loaded via dotenv
 * - CORS is configured to allow frontend access
 * - Error handling middleware catches and logs errors
 * - All routes are prefixed with /api/ for clarity
 */

import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import route modules
import authRoutes from '../src/routes/auth.js';
import responseRoutes from '../src/routes/responses.js';
import adminRoutes from '../src/routes/admin.js';
import questionnaireRoutes from '../src/routes/questionnaires.js';
import fileUploadRoutes from '../src/routes/file-upload.js';

// Initialize Express app
const app = express();

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

// CORS Configuration - Allow frontend to access API
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware - Parse JSON with 10MB limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint - Verify API is running
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EUDA Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// API Routes - All prefixed with /api/
app.use('/api/auth', authRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
app.use('/api/file-upload', fileUploadRoutes);

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    name: 'EUDA Questionnaire Backend API',
    version: '1.0.0',
    status: 'running',
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

// 404 Handler - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler - Catch all errors
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// EXPORT SERVERLESS HANDLER
// ==========================================

// Wrap Express app with serverless-http for Vercel compatibility
export default serverless(app);
