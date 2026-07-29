require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendPromptToGpt5Mini } = require('../gptClient');
const { sendPromptToGrok4 } = require('../grokClient');
const { sendPromptToClaude4Haiku } = require('../claudeClient');


const app = express();


app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {

    const { model, prompt } = req.body;
    let answer = '';

   if (model === 'all') {
    const [claudeAnswer, gptAnswer, grokAnswer] = await Promise.all([
    sendPromptToClaude4Haiku(prompt),
    sendPromptToGpt5Mini(prompt),
    sendPromptToGrok4(prompt)
  ]);
  
  return res.json({ result: { claude: claudeAnswer, gpt: gptAnswer, grok: grokAnswer } });
}

    if(model === 'gpt') {
      answer = await sendPromptToGpt5Mini(prompt);
    }
    else if(model === 'grok') {
      answer = await sendPromptToGrok4(prompt);
    }
    else if(model === 'claude') {
      answer = await sendPromptToClaude4Haiku(prompt);
    }
    else {
      res.status(400).json('Invalid model specified');
      return;
    }

    res.json({ result: answer });
    return;

  } 
  catch (error) {

    res.status(500).json('Error status 500 from /api/generate');
    return;

  }
});

module.exports = app;

// ... all your existing route code stays the same ...

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 5050;
  app.listen(port, () => {
    console.log(`Backend listening on local port: ${port}`);
  });
}