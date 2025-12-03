require('dotenv').config();
const OpenAI = require('openai');

console.log('loading gpt');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function sendPromptToGpt5Mini(prompt) {
  // TODO: add a prefix to prompt to guide the model toward better answers
  // TODO: maybe add some error handling here
  try {
    
    // Code grabbed from the OpenAI docs
    const response = await client.responses.create({
      model: 'gpt-5-mini',
      input: prompt,
    });

    const output = response.output_text

    // TODO: instead of returning the whole text, parse out just the answer portion
    return output;

  } 
  catch (error) {

    console.error('Error in sendPromptToGpt5Mini:', error);
    throw error;

  }
}

module.exports = { sendPromptToGpt5Mini };