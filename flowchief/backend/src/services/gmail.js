const { google } = require('googleapis');
const { getAuthorizedGoogleClient } = require('./google');
const { IMPORTANT_KEYWORDS } = require('../utils/keywords');

function extractHeader(headers, name) {
  const h = headers.find((hdr) => hdr.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : '';
}

function hasKeyword(text) {
  const lower = (text || '').toLowerCase();
  return IMPORTANT_KEYWORDS.some((k) => lower.includes(k));
}

async function getRecentEmails(userId, options = {}) {
  const client = await getAuthorizedGoogleClient(userId);
  if (!client) return [];

  const gmail = google.gmail({ version: 'v1', auth: client });
  const lookbackHours = options.lookback_hours || 36;
  const maxThreads = options.max_threads || 30;
  const query = `in:inbox newer_than:${lookbackHours}h`;

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: maxThreads
  });

  const messages = listRes.data.messages || [];
  const results = [];

  for (const msg of messages) {
    const msgRes = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date']
    });

    const headers = msgRes.data.payload?.headers || [];
    const from = extractHeader(headers, 'From');
    const subject = extractHeader(headers, 'Subject');
    const date = extractHeader(headers, 'Date');
    const snippet = msgRes.data.snippet || '';
    const labelIds = msgRes.data.labelIds || [];

    results.push({
      id: msg.id,
      threadId: msgRes.data.threadId,
      from,
      subject,
      date,
      snippet,
      unread: labelIds.includes('UNREAD'),
      keyword_match: hasKeyword(subject + ' ' + snippet)
    });
  }

  return results;
}

function selectImportantEmails(emails, maxCount = 5) {
  const sorted = [...emails].sort((a, b) => {
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    if (a.keyword_match !== b.keyword_match) return a.keyword_match ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  return sorted.slice(0, maxCount);
}

module.exports = { getRecentEmails, selectImportantEmails };
