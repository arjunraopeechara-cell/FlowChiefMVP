const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../db');

const router = express.Router();

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
  res.cookie('auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post('/register', async (req, res) => {
  const { email, password, time_zone } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash }
  });

  await prisma.userSettings.create({
    data: {
      userId: user.id,
      timeZone: time_zone || 'UTC',
      briefingTime: '08:00',
      workDays: 'Mon,Tue,Wed,Thu,Fri',
      includeCalendar: true,
      includeEmails: true,
      includeReplies: true,
      tone: 'neutral professional',
      tasksText: ''
    }
  });

  setAuthCookie(res, user);
  return res.json({ id: user.id, email: user.email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  setAuthCookie(res, user);
  return res.json({ id: user.id, email: user.email });
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth');
  return res.json({ success: true });
});

module.exports = router;
