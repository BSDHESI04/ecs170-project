module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId, choice } = req.body;

    if (!promptId || !choice) {
      return res.status(400).json({ error: 'Missing promptId or choice' });
    }

    // Log the choice (you can extend this to save to a database later)
    console.log(`User choice logged - Prompt: ${promptId}, Choice: ${choice}`);

    return res.status(200).json({ ok: true, logged: true });
  } catch (error) {
    console.error('Error in /api/submit-human-choice:', error);
    return res.status(500).json({ error: 'Error processing request', details: error.message });
  }
};
