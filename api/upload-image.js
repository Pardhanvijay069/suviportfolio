const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

const ALLOWED_KEYS = ['drafting_image', 'drawing_image', 'cad_image'];

const DEFAULT_IMAGES = {
  drafting_image: "https://res.cloudinary.com/cxe05iuw/image/upload/v1789133549/drafting_msbn02.png",
  drawing_image: "https://res.cloudinary.com/cxe05iuw/image/upload/v1789133549/drawing_yrygua.png",
  cad_image: "https://res.cloudinary.com/cxe05iuw/image/upload/v1789132796/frame_000300_wqju8i.webp"
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Authenticate Request
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({
      error: 'ADMIN_PASSWORD environment variable is not set in Vercel project settings.'
    });
  }

  let providedPassword = '';
  if (req.headers.authorization) {
    providedPassword = req.headers.authorization.replace(/^Bearer\s+/i, '').trim();
  } else if (req.headers['x-admin-token']) {
    providedPassword = String(req.headers['x-admin-token']).trim();
  } else if (req.body && req.body.password) {
    providedPassword = String(req.body.password).trim();
  }

  const expectedBuffer = Buffer.from(expectedPassword);
  const providedBuffer = Buffer.from(providedPassword);

  const isAuthValid =
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);

  if (!isAuthValid) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin password' });
  }

  // 2. Validate Cloudinary Credentials
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "cxe05iuw";
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({
      error: 'CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET is missing from server environment variables.'
    });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  // 3. Validate Inputs
  const { key, file } = req.body || {};

  if (!key || !ALLOWED_KEYS.includes(key)) {
    return res.status(400).json({
      error: `Invalid key "${key}". Allowed keys: ${ALLOWED_KEYS.join(', ')}`
    });
  }

  if (!file || typeof file !== 'string') {
    return res.status(400).json({
      error: 'Image file data is missing or invalid. Please provide a base64 Data URI.'
    });
  }

  try {
    // 4. Upload Image to Cloudinary in dedicated folder
    const timestamp = Date.now();
    const publicId = `${key}_${timestamp}`;

    const uploadResult = await cloudinary.uploader.upload(file, {
      folder: 'suvi_portfolio/admin',
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      tags: ['portfolio_cms', key]
    });

    const newImageUrl = uploadResult.secure_url;

    // 5. Load Existing Config or Fallback
    let currentConfig = { ...DEFAULT_IMAGES };
    try {
      const configUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/suvi_portfolio/admin/site_config.json?t=${timestamp}`;
      const configFetch = await fetch(configUrl);
      if (configFetch.ok) {
        const remoteConfig = await configFetch.json();
        currentConfig = { ...currentConfig, ...remoteConfig };
      }
    } catch (fetchErr) {
      console.warn("Existing config fetch skipped, will initialize fresh:", fetchErr.message);
    }

    // 6. Update and Persist Configuration to Cloudinary
    currentConfig[key] = newImageUrl;
    currentConfig.updated_at = new Date().toISOString();

    const base64Config = Buffer.from(JSON.stringify(currentConfig, null, 2)).toString('base64');
    await cloudinary.uploader.upload(`data:application/json;base64,${base64Config}`, {
      folder: 'suvi_portfolio/admin',
      public_id: 'site_config.json',
      resource_type: 'raw',
      overwrite: true,
      invalidate: true
    });

    return res.status(200).json({
      success: true,
      key,
      url: newImageUrl,
      images: currentConfig
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return res.status(500).json({
      error: `Upload failed: ${error.message || error}`
    });
  }
};
