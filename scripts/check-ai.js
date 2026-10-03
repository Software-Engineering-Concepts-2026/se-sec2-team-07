import { generate } from '../src/backend/modules/generation/service.js';

import { readAiConfig } from '../src/backend/config.js';
const config = readAiConfig();
if (!config.aiKey || !config.aiModel) {
  console.error('AI is not configured. Set OPENAI_API_KEY and OPENAI_MODEL in your server .env; never paste the key into chat or commit it.');
  process.exitCode = 1;
} else if (!process.argv.includes('--live')) {
  console.log('AI configuration present. Use --live to send one synthetic lesson to the configured AI provider (API usage charges may apply). No request was sent.');
} else {
  try {
    const cards = await generate({ mode: 'ai', count: 2, language: 'Thai', level: 'beginner',
      text: 'A stack uses last-in, first-out (LIFO). A queue uses first-in, first-out (FIFO).' }, config);
    console.log(JSON.stringify({ ok: true, model: config.aiModel, cards }, null, 2));
  } catch (error) {
    console.error(error.status ? error.message : 'AI connection check failed.');
    process.exitCode = 1;
  }
}
