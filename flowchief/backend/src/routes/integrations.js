const express = require('express');
const crypto = require('crypto');
const { authRequired } = require('../middleware/auth');
const { getGoogleAuthUrl, exchangeCodeForTokens } = require('../services/google');

const router = express.Router();

router.get('/google/start', authRequired, async (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000
  });
  const url = getGoogleAuthUrl(state);
  return res.redirect(url);
});

router.get('/google/callback', authRequired, async (req, res) => {
  const { code, state } = req.query || {};
  if (!code || !state) return res.status(400).send('Missing code/state');
  if (!req.cookies || req.cookies.oauth_state !== state) {
    return res.status(400).send('Invalid state');
  }
  try {
    await exchangeCodeForTokens(req.user.id, code);
    res.clearCookie('oauth_state');
    return res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/dashboard');
  } catch (err) {
    return res.status(500).send('OAuth failed');
  }
});

module.exports = router;
