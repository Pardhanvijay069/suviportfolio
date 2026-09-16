const DEFAULT_IMAGES = {
  drafting_image: "https://res.cloudinary.com/cxe05iuw/image/upload/v1789133549/drafting_msbn02.png",
  drawing_image: "https://res.cloudinary.com/cxe05iuw/image/upload/v1789133549/drawing_yrygua.png",
  cad_image: "https://res.cloudinary.com/cxe05iuw/image/upload/v1789132796/frame_000300_wqju8i.webp"
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "cxe05iuw";
  const noCache = req.query && (req.query.nocache || req.query.t);

  if (noCache) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
  }

  try {
    // Attempt to load the persistent configuration stored in Cloudinary
    const configUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/suvi_portfolio/admin/site_config.json?t=${Date.now()}`;
    const response = await fetch(configUrl);

    if (response.ok) {
      const data = await response.json();
      // Merge with defaults so any missing slot has a fallback
      const merged = {
        ...DEFAULT_IMAGES,
        ...data
      };
      return res.status(200).json(merged);
    }
  } catch (error) {
    console.warn("Could not fetch remote site_config.json from Cloudinary, using defaults:", error.message);
  }

  // Fallback to default images
  return res.status(200).json(DEFAULT_IMAGES);
};
