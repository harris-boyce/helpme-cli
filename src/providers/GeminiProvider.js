import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { buildSystemPrompt } from '../prompt.js';
import { parseSuggestionJson } from '../utils/json.js';

export class GeminiProvider {
  constructor({ apiKey, model }) {
    if (!apiKey) throw new Error('Missing GOOGLE_API_KEY for Gemini provider');
    this.model = model || 'gemini-2.5-flash';
    this.ai = genkit({
      plugins: [
        googleAI({
          apiKey,
        }),
      ],
    });
  }

  async suggest({ request, cwd, os }) {
    const system = buildSystemPrompt();
    const prompt = `${system}\n\nUser request: ${request}\n\nReply ONLY with the JSON object as described.`;

    const response = await this.ai.generate({
      model: `googleai/${this.model}`,
      prompt,
      config: { temperature: 0.2, maxOutputTokens: 512 },
    });

    const text = response.text || '';
    return parseSuggestionJson(text);
  }
}


