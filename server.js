const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import modules
const assessmentModule = require('./modules/assessment');
const scenariosModule = require('./modules/scenarios');
const interviewModule = require('./modules/interview');
const reviewsModule = require('./modules/reviews');
const sheetsIntegration = require('./integrations/googleSheets');

// API Routes
app.use('/api/assessment', assessmentModule);
app.use('/api/scenarios', scenariosModule);
app.use('/api/interview', interviewModule);
app.use('/api/reviews', reviewsModule);
app.use('/api/sheets', sheetsIntegration);

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Epworth Family Resources Interview Assistant',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Epworth Family Resources Interview Assistant           ║
║     Interview & Assessment Intelligence                    ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                    ║
║  Core Values: Trauma-Informed Care | Family Preservation  ║
║               Professional Growth | Accountability         ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
