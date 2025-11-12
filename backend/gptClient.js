require('dotenv').config();
const OpenAI = require('openai');

console.log('loading gpt');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function sendPromptToGpt5Mini(prompt) {

  try {
    
    // Code grabbed from the OpenAI docs
    const response = await client.responses.create({
      model: 'gpt-5-mini',
      input: prompt,
    });

    const output = response.output_text
    return output;

  } 
  catch (error) {

    console.error('Error in sendPromptToGpt5Mini:', error);
    throw error;

  }
}

module.exports = { sendPromptToGpt5Mini };