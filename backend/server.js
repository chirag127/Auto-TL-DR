require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();

// Set port
const PORT = process.env.PORT || 3000;

// Configure CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Configure body parser
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Auto TL;DR API',
    version: '1.0.0',
    endpoints: {
      summarize: '/api/summarize',
      summarizeThread: '/api/summarize/thread',
      health: '/api/health',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Auto TL;DR server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
