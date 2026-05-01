const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const prisma = new PrismaClient();

// ✅ Health route FIRST (no DB dependency)
app.get('/api/health', (req, res) => {
  res.status(200).send('ok');
});

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

app.use(express.json());

// API routes (we’ll protect them later if needed)
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ✅ Use Railway port
const PORT = process.env.PORT || 8080;

// ✅ Start server FIRST
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // ✅ Connect DB AFTER server is live
  prisma.$connect()
    .then(() => console.log('✅ Database connected'))
    .catch((err) => {
      console.error('❌ DB connection failed:', err.message);
      // Do NOT crash — keep server alive for healthcheck
    });
});