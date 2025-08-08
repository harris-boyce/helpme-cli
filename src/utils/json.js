export function parseSuggestionJson(text) {
  const str = String(text || '').trim();
  // Try to locate the first JSON object in the text
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return JSON. Please refine your configuration or try again.');
  }
  let obj;
  try {
    obj = JSON.parse(str.slice(start, end + 1));
  } catch (e) {
    throw new Error('Failed to parse model JSON output.');
  }
  // Validate shape
  if (!('needsInput' in obj)) obj.needsInput = false;
  if (!('question' in obj)) obj.question = null;
  if (!('command' in obj)) obj.command = null;
  if (typeof obj.explanation !== 'string') obj.explanation = '';
  return obj;
}


