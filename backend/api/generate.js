require('dotenv').config();
const { sendPromptToGpt5Mini } = require('../gptClient');
const { sendPromptToGrok4 } = require('../grokClient');
const { sendPromptToClaude4Haiku } = require('../claudeClient');

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
    const { model, prompt } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: 'Missing model or prompt' });
    }

    let result;

    if (model === 'all') {
      const claudeAnswer = await sendPromptToClaude4Haiku(prompt);
      const gptAnswer = await sendPromptToGpt5Mini(prompt);
      const grokAnswer = await sendPromptToGrok4(prompt);
      result = { claude: claudeAnswer, gpt: gptAnswer, grok: grokAnswer };
    } else if (model === 'gpt') {
      result = await sendPromptToGpt5Mini(prompt);
    } else if (model === 'grok') {
      result = await sendPromptToGrok4(prompt);
    } else if (model === 'claude') {
      result = await sendPromptToClaude4Haiku(prompt);
    } else {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    return res.status(200).json({ result });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    return res.status(500).json({ error: 'Error processing request', details: error.message });
  }
};
