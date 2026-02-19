const express = require('express');
const { prisma } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  const settings = await prisma.userSettings.findUnique({ where: { userId: req.user.id } });
  return res.json(settings);
});

router.put('/', authRequired, async (req, res) => {
  const data = req.body || {};
  const settings = await prisma.userSettings.update({
    where: { userId: req.user.id },
    data: {
      timeZone: data.timeZone,
      briefingTime: data.briefingTime,
      workDays: data.workDays,
      includeCalendar: data.includeCalendar,
      includeEmails: data.includeEmails,
      includeReplies: data.includeReplies,
      tone: data.tone,
      tasksText: data.tasksText
    }
  });
  return res.json(settings);
});

module.exports = router;
