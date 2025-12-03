require('dotenv').config();
const {xai} = require('@ai-sdk/xai');
const { generateText } = require('ai');

async function sendPromptToGrok4(sent_prompt) {
    try {

        // Code grabbed from the XAI docs
        const result = await generateText({
            model: xai('grok-4-1-fast-reasoning'),
            system: 'You are Grok, a highly intelligent, helpful AI assistant.',
            prompt: sent_prompt,
        });
         return result.text
    } catch (error) {
        console.error('Error sending prompt to Grok-4:', error);
        throw error;
    }
}

module.exports = { sendPromptToGrok4 };