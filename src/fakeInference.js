function escapeForDoubleQuotes(text) {
  return String(text || '').replaceAll('"', '\\"');
}

export function suggestCommandFromRequest(rawRequest) {
  const request = String(rawRequest || '').trim();
  const q = request.toLowerCase();
  if (!q) return { needsInput: true, question: 'What command do you need help with?' };

  // Simple heuristics (fake mode)
  if (q.includes('git') && (q.includes('pull') || q.includes('latest'))) {
    return {
      command: 'git pull',
      explanation: 'Pull the latest changes from your current branch\'s upstream remote.',
    };
  }

  if (q.includes('list') && q.includes('files')) {
    return {
      command: 'ls -la',
      explanation: 'List files (long format) including hidden files.',
    };
  }

  if (q.includes('current') && q.includes('branch') && q.includes('git')) {
    return {
      command: 'git branch --show-current',
      explanation: 'Show the current Git branch name.',
    };
  }

  if ((q.includes('install') || q.includes('i ')) && q.includes('npm')) {
    return {
      command: 'npm install',
      explanation: 'Install npm dependencies as defined in package.json.',
    };
  }

  if (q.includes('deploy')) {
    return {
      needsInput: true,
      question: 'Which environment should I deploy to? (dev/staging/prod)',
      explanation: 'Deployment requires an environment selection.',
    };
  }

  // Default fake fallback
  return {
    command: `echo \"${escapeForDoubleQuotes(request)}\"`,
    explanation: 'No rule matched (fake mode). Real AI selection will replace this.',
  };
}


