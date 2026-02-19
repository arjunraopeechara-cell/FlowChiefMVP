const cron = require('node-cron');
const { prisma } = require('../db');
const { shouldSendBriefingNow, generateAndSendDailyBriefing } = require('./briefing');

function startScheduler() {
  cron.schedule('*/5 * * * *', async () => {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      try {
        const shouldSend = await shouldSendBriefingNow(user.id);
        if (shouldSend) {
          await generateAndSendDailyBriefing(user.id);
        }
      } catch (err) {
        // Swallow to keep scheduler running
      }
    }
  });
}

module.exports = { startScheduler };
