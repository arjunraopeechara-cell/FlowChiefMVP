const { google } = require('googleapis');
const { DateTime } = require('luxon');
const { getAuthorizedGoogleClient } = require('./google');

async function getTodayEvents(userId, settings) {
  const client = await getAuthorizedGoogleClient(userId);
  if (!client) return [];
  const calendar = google.calendar({ version: 'v3', auth: client });

  const tz = settings.timeZone || 'UTC';
  const start = DateTime.now().setZone(tz).startOf('day');
  const end = start.endOf('day');

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: start.toISO(),
    timeMax: end.toISO(),
    singleEvents: true,
    orderBy: 'startTime'
  });

  const items = res.data.items || [];
  return items.map((evt) => ({
    id: evt.id,
    summary: evt.summary || '(no title)',
    start_time: evt.start?.dateTime || evt.start?.date,
    end_time: evt.end?.dateTime || evt.end?.date,
    location: evt.location || null,
    attendees: (evt.attendees || []).map((a) => a.email)
  }));
}

module.exports = { getTodayEvents };
