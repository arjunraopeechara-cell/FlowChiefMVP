const { DateTime } = require('luxon');
const { prisma } = require('../db');
const { getTodayEvents } = require('./calendar');
const { getRecentEmails, selectImportantEmails } = require('./gmail');
const { generateBriefingWithLLM } = require('./llm');
const { renderBriefingEmailHtml } = require('../templates/briefingEmail');
const { sendEmail } = require('./email');

async function generateAndSendDailyBriefing(userId, { force = false } = {}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) throw new Error('Settings not found');

  const tz = settings.timeZone || 'UTC';
  const today = DateTime.now().setZone(tz).toISODate();

  if (!force) {
    const existing = await prisma.briefingLog.findUnique({
      where: { userId_date: { userId, date: today } }
    });
    if (existing && existing.status === 'sent') return;
  }

  const log = await prisma.briefingLog.upsert({
    where: { userId_date: { userId, date: today } },
    update: { status: 'running', errorMessage: null },
    create: { userId, date: today, status: 'running' }
  });

  try {
    const events = settings.includeCalendar ? await getTodayEvents(userId, settings) : [];
    const emails = settings.includeEmails
      ? await getRecentEmails(userId, { lookback_hours: 36, max_threads: 30 })
      : [];
    const importantEmails = settings.includeEmails ? selectImportantEmails(emails, 5) : [];

    const tasks = (settings.tasksText || '')
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const llmResult = await generateBriefingWithLLM({
      userProfile: 'solo founder',
      settings,
      events,
      importantEmails,
      tone: settings.tone,
      tasks
    });

    if (!settings.includeReplies) {
      llmResult.emails = (llmResult.emails || []).map((e) => ({ ...e, suggested_reply: '' }));
    }

    const html = renderBriefingEmailHtml(llmResult);
    await sendEmail({
      userId,
      to: user.email,
      subject: 'Your Daily Briefing',
      html
    });

    await prisma.briefingLog.update({
      where: { id: log.id },
      data: { status: 'sent', sentAt: new Date() }
    });
  } catch (err) {
    await prisma.briefingLog.update({
      where: { id: log.id },
      data: { status: 'error', errorMessage: err.message }
    });
    throw err;
  }
}

async function shouldSendBriefingNow(userId) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) return false;

  const tz = settings.timeZone || 'UTC';
  const now = DateTime.now().setZone(tz);
  const workDays = settings.workDays.split(',');
  const dayName = now.toFormat('ccc');
  if (!workDays.includes(dayName)) return false;

  const [hour, minute] = settings.briefingTime.split(':').map(Number);
  const target = now.set({ hour, minute, second: 0, millisecond: 0 });
  const diffMinutes = Math.abs(now.diff(target, 'minutes').minutes);

  if (diffMinutes > 5) return false;

  const today = now.toISODate();
  const existing = await prisma.briefingLog.findUnique({
    where: { userId_date: { userId, date: today } }
  });
  if (existing && existing.status === 'sent') return false;

  return true;
}

module.exports = { generateAndSendDailyBriefing, shouldSendBriefingNow };
