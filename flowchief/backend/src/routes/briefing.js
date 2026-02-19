const express = require('express');
const { authRequired } = require('../middleware/auth');
const { generateAndSendDailyBriefing } = require('../services/briefing');

const router = express.Router();

router.post('/test', authRequired, async (req, res) => {
  try {
    await generateAndSendDailyBriefing(req.user.id, { force: true });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Failed' });
  }
});

module.exports = router;
