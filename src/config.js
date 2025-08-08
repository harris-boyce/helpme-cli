export function getConfig({ providerOverride } = {}) {
  const provider = providerOverride || process.env.HELPME_PROVIDER || 'fake';
  return {
    provider,
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      model: process.env.HELPME_OLLAMA_MODEL || 'llama3.2',
    },
    gemini: {
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '',
      model: process.env.GOOGLE_MODEL || 'gemini-2.5-flash',
    },
  };
}

export function getPasteShortcut() {
  const platform = process.platform;
  if (platform === 'darwin') return 'Cmd+V';
  if (platform === 'win32') return 'Ctrl+V';
  return 'Ctrl+Shift+V';
}


