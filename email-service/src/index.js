require('dotenv').config();
const express = require('express');
const cors = require('cors');
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse CORS origins from environment (comma-separated) or use defaults
const corsOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:3001'];

// Middleware
app.use(cors({
        origin: corsOrigins,
        credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', emailRoutes);

// Health check
app.get('/health', (req, res) => {
        res.json({ status: 'Email Service is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
        console.error('Error:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
        console.log(`Email Service running on port ${PORT}`);
});

module.exports = app;
