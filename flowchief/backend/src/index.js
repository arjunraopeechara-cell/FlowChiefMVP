require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { prisma } = require('./db');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const integrationsRoutes = require('./routes/integrations');
const briefingRoutes = require('./routes/briefing');
const { authRequired } = require('./middleware/auth');
const { startScheduler } = require('./services/scheduler');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/briefing', briefingRoutes);

app.get('/api/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const settings = await prisma.userSettings.findUnique({ where: { userId: req.user.id } });
  const token = await prisma.oAuthTokens.findFirst({ where: { userId: req.user.id, provider: 'google' } });
  return res.json({
    id: user.id,
    email: user.email,
    settings,
    integrations: {
      google: !!token
    }
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  startScheduler();
  console.log(`Backend listening on ${port}`);
});
