function stripCodeFences(input) {
  const s = String(input || '');
  const fenceMatch = s.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
  return s.trim();
}

function extractFirstJsonObject(input) {
  const s = stripCodeFences(input);
  for (let i = 0; i < s.length; i += 1) {
    if (s[i] !== '{') continue;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let escaped = false;
    for (let j = i; j < s.length; j += 1) {
      const ch = s[j];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === stringChar) {
          inString = false;
        }
      } else {
        if (ch === '"' || ch === '\'') {
          inString = true;
          stringChar = ch;
        } else if (ch === '{') {
          depth += 1;
        } else if (ch === '}') {
          depth -= 1;
          if (depth === 0) {
            return s.slice(i, j + 1);
          }
        }
      }
    }
  }
  return null;
}

export function parseSuggestionJson(text) {
  const candidate = extractFirstJsonObject(text);
  if (!candidate) {
    // Fallback: treat whole text as an answer to avoid UX dead-ends
    const answerText = String(text || '').trim();
    return {
      type: 'answer',
      command: null,
      answer: answerText || null,
      explanation: 'Model returned non-JSON; parsed as plain answer.',
      needsInput: false,
      question: null,
    };
  }
  let obj;
  try {
    obj = JSON.parse(candidate);
  } catch (e) {
    // Fallback to plain answer
    const answerText = String(text || '').trim();
    return {
      type: 'answer',
      command: null,
      answer: answerText || null,
      explanation: 'Failed to parse JSON; returned plain answer.',
      needsInput: false,
      question: null,
    };
  }
  // Validate shape
  if (!('needsInput' in obj)) obj.needsInput = false;
  if (!('question' in obj)) obj.question = null;
  if (!('type' in obj)) obj.type = obj.command ? 'command' : (obj.answer ? 'answer' : 'answer');
  if (!('command' in obj)) obj.command = null;
  if (!('answer' in obj)) obj.answer = null;
  if (typeof obj.explanation !== 'string') obj.explanation = '';
  // Normalize type
  if (obj.type !== 'command' && obj.type !== 'answer') {
    obj.type = obj.command ? 'command' : 'answer';
  }
  return obj;
}


