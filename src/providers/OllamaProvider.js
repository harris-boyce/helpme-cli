import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';
import { buildSystemPrompt } from '../prompt.js';
import { parseSuggestionJson } from '../utils/json.js';

export class OllamaProvider {
  constructor({ serverAddress, model }) {
    this.model = model;
    this.ai = genkit({
      plugins: [
        ollama({
          models: [{ name: model, type: 'generate' }],
          serverAddress: serverAddress || 'http://127.0.0.1:11434',
        }),
      ],
    });
  }

  async suggest({ request, cwd, os }) {
    const system = buildSystemPrompt();
    const prompt = `${system}\n\nUser request: ${request}\n\nReply ONLY with the JSON object as described.`;

    const response = await this.ai.generate({
      model: `ollama/${this.model}`,
      prompt,
      config: { temperature: 0.2, maxOutputTokens: 512 },
    });

    const text = response.text || '';
    return parseSuggestionJson(text);
  }
}


