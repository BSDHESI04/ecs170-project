require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const Client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });


async function sendPromptToClaude4Haiku(sent_prompt) {
    try {
        const completion = await Client.beta.messages.create({
        max_tokens: 1024,
        messages: [{ content: sent_prompt, role: 'user' }],
        model: 'claude-haiku-4-5-20251001',
        });
        return completion.content[0].text;
    } catch (error) {
        console.error('Error sending prompt to Claude-4-5-Haiku:', error);
        throw error;
    }
}
module.exports = { sendPromptToClaude4Haiku };


