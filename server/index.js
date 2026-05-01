const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ health route FIRST (no DB)
app.get('/api/health', (req, res) => {
  res.status(200).send('ok');
});

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// 👉 TEMP: comment routes (important)
/// const authRoutes = require('./routes/auth');
/// const projectRoutes = require('./routes/projects');
/// const taskRoutes = require('./routes/tasks');
/// const dashboardRoutes = require('./routes/dashboard');

/// app.use('/api/auth', authRoutes);
/// app.use('/api/projects', projectRoutes);
/// app.use('/api/tasks', taskRoutes);
/// app.use('/api/dashboard', dashboardRoutes);

// serve frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});