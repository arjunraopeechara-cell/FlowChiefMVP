const { google } = require('googleapis');
const { prisma } = require('../db');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send'
];

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getGoogleAuthUrl(state) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state
  });
}

async function exchangeCodeForTokens(userId, code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

  const existing = await prisma.oAuthTokens.findFirst({
    where: { userId, provider: 'google' }
  });

  const data = {
    userId,
    provider: 'google',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiry,
    scopes: SCOPES.join(' ')
  };

  if (existing) {
    return prisma.oAuthTokens.update({ where: { id: existing.id }, data });
  }
  return prisma.oAuthTokens.create({ data });
}

async function getAuthorizedGoogleClient(userId) {
  const token = await prisma.oAuthTokens.findFirst({
    where: { userId, provider: 'google' }
  });
  if (!token) return null;

  const client = getOAuthClient();
  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiry.getTime()
  });

  if (token.expiry.getTime() < Date.now() + 60 * 1000) {
    const { credentials } = await client.refreshAccessToken();
    const expiry = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000);
    await prisma.oAuthTokens.update({
      where: { id: token.id },
      data: {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || token.refreshToken,
        expiry
      }
    });
    client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || token.refreshToken,
      expiry_date: expiry.getTime()
    });
  }

  return client;
}

module.exports = { getGoogleAuthUrl, exchangeCodeForTokens, getAuthorizedGoogleClient };
