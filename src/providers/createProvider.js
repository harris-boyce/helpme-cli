import { OllamaProvider } from './OllamaProvider.js';
import { GeminiProvider } from './GeminiProvider.js';

export function createProvider(config) {
  const provider = (config?.provider || 'gemini').toLowerCase();
  if (provider === 'ollama') {
    const model = config?.ollama?.model || 'llama3.2';
    return new OllamaProvider({
      serverAddress: config?.ollama?.baseUrl || 'http://127.0.0.1:11434',
      model,
    });
  }
  if (provider === 'gemini') {
    return new GeminiProvider({
      apiKey: config?.gemini?.apiKey,
      model: config?.gemini?.model || 'gemini-2.5-flash',
    });
  }
  throw new Error(`Unknown provider: ${provider}. Use 'ollama' or 'gemini'.`);
}


