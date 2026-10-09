import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { initDb } from './config/db.js';
import { connectMongoDB } from './config/mongo.js';
import { seedDatabase } from './seed.js';
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import hrAdminRoutes from './routes/hrAdminRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import candidatePortalRoutes from './routes/candidatePortalRoutes.js';
import osintRoutes from './routes/osintRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

// Body Parsing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', apiLimiter);

// Static Uploads Serving
const uploadPath = path.resolve(config.UPLOAD_DIR);
app.use('/uploads', express.static(uploadPath));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Candidate Trust & Fraud Intelligence API',
    demoMode: config.DEMO_MODE,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/review', hrAdminRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/candidate', candidatePortalRoutes);
app.use('/api/osint', osintRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const startServer = async () => {
  try {
    await initDb();
    await connectMongoDB();
    await seedDatabase();
    app.listen(config.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🔒 Candidate Trust & Fraud Intelligence API`);
      console.log(`🚀 Running at: http://localhost:${config.PORT}`);
      console.log(`🛡️ Demo Mode: ${config.DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
