require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendPromptToGpt5Mini } = require('./gptClient');

const app = express();
const port = 5050; // Port 4000 doesn't work on my computer... idk why

app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {

    const { prompt } = req.body;

    const answer = await sendPromptToGpt5Mini(prompt);

    res.json({ result: answer });

  } 
  catch (error) {

    res.status(500).json('Error status 500 from /api/generate');

  }
});

app.listen(port, () => {
  console.log(`Backend listening on local port: ${port}`);
});
