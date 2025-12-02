require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendPromptToGpt5Mini } = require('./gptClient');
const { sendPromptToGrok4 } = require('./grokClient');
const { sendPromptToClaude4Haiku } = require('./claudeClient');


const app = express();
const port = 5050; // Port 4000 doesn't work on my computer... idk why

app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {

    const { model } = req.body;
    let answer = null
    const { prompt } = req.body;

    if(model === 'gpt') {
      answer = await sendPromptToGpt5Mini(prompt);
      res.json({ result: answer });
      return;
    }
    else if(model === 'grok') {
    
      answer = await sendPromptToGrok4(prompt);
      res.json({ result: answer });
      return; 

    }
    else if(model === 'claude') {
      answer = await sendPromptToClaude4Haiku(prompt);
      res.json({ result: answer });
      return;
    }
    else if(model === 'all') {
      const claudeAnswer = await sendPromptToClaude4Haiku(prompt);
      const gptAnswer = await sendPromptToGpt5Mini(prompt);
      const grokAnswer = await sendPromptToGrok4(prompt);
      res.json({ result: { claude: claudeAnswer, gpt: gptAnswer, grok: grokAnswer } });
      return;
    }
    else {
      res.status(400).json('Invalid model specified');
      return;
    }

  } 
  catch (error) {

    res.status(500).json('Error status 500 from /api/generate');
    return;

  }
});

app.listen(port, () => {
  console.log(`Backend listening on local port: ${port}`);
});
