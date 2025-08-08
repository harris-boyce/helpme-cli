import { execSync } from 'node:child_process';

export function checkSetup(config) {
  const messages = [];
  const provider = (config?.provider || 'fake').toLowerCase();

  if (provider === 'ollama') {
    // Check if ollama is reachable
    try {
      execSync('ollama --version', { stdio: 'ignore' });
    } catch {
      messages.push(
        'Ollama not found. Install from https://ollama.ai and ensure it is on your PATH.'
      );
    }
    // Server address guidance
    if (!config?.ollama?.baseUrl) {
      messages.push('Set OLLAMA_BASE_URL in .env (default: http://127.0.0.1:11434).');
    }
    if (!config?.ollama?.model) {
      messages.push('Set HELPME_OLLAMA_MODEL in .env (e.g., llama3.2 or gemma2:2b).');
    }
  } else if (provider === 'gemini') {
    if (!config?.gemini?.apiKey) {
      messages.push('Missing GOOGLE_API_KEY in .env. Get a key from Google AI Studio.');
    }
    if (!config?.gemini?.model) {
      messages.push('Optionally set GOOGLE_MODEL in .env (gemini-2.5-flash or gemini-1.5-pro).');
    }
  } else if (provider === 'fake') {
    messages.push('Provider is set to fake. Set HELPME_PROVIDER=ollama or gemini in .env to enable AI.');
  }

  return messages;
}


