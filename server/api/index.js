// Serverless function handler for Vercel
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../src/routes/auth.js';
import responseRoutes from '../src/routes/responses.js';
import adminRoutes from '../src/routes/admin.js';
import questionnaireRoutes from '../src/routes/questionnaires.js';
// Temporarily comment out file-upload to test if it's causing the issue
// import fileUploadRoutes from '../src/routes/file-upload.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'EUDA Backend API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
// app.use('/api/file-upload', fileUploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Export the Express app as default
export default app;
