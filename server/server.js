const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Global Middleware
app.use(helmet());

// CORS: only relevant now for local dev (Vite dev server on a different port).
// In production, frontend and backend are served from the same origin, so
// this header is a no-op there but harmless to leave in place.
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

// Parses incoming JSON payloads
app.use(express.json());

// General rate limiter: protects all API routes from abuse/scraping
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests. Please try again later.' }
});
app.use('/api', generalLimiter);

// Stricter limiter specifically for login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many login attempts. Please try again later.' }
});
app.use('/api/auth', authLimiter);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Swastha Hospital API is running.'
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);

// JSON 404 handler, scoped to /api only — any unmatched API route
app.use('/api', (req, res) => {
  res.status(404).json({ status: 'fail', message: 'API route not found.' });
});

// --- Serve the built React frontend ---
// client/dist is produced by `npm run build` inside the client workspace.
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all: any non-API route serves index.html, letting React Router
// handle client-side routing (e.g. /admin, /associate, /login all resolve
// to the same index.html, and the frontend router takes it from there).
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Global error handler — catches anything thrown/passed via next(err)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: isProd ? 'Something went wrong on our end.' : err.message
  });
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});