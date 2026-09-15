const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({
      error: 'ADMIN_PASSWORD environment variable is not set in Vercel project settings.'
    });
  }

  let providedPassword = '';
  if (req.body && req.body.password) {
    providedPassword = String(req.body.password);
  } else if (req.headers.authorization) {
    providedPassword = req.headers.authorization.replace(/^Bearer\s+/i, '').trim();
  }

  const expectedBuffer = Buffer.from(expectedPassword);
  const providedBuffer = Buffer.from(providedPassword);

  const isValid =
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  return res.status(200).json({ authenticated: true });
};
