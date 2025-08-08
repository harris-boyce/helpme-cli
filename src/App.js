import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import clipboard from 'clipboardy';
import { getPasteShortcut, getConfig } from './config.js';
import { suggestCommandFromRequest } from './fakeInference.js';
import { createProvider } from './providers/createProvider.js';
import { checkSetup } from './setupChecks.js';

export function App({ initialRequest = '', copyToClipboard = true, debug = false, providerOverride } = {}) {
  const { exit } = useApp();
  const [request, setRequest] = useState(String(initialRequest || ''));
  const [phase, setPhase] = useState(request ? 'thinking' : 'input');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [setupIssues, setSetupIssues] = useState([]);
  const [providerInstance, setProviderInstance] = useState(null);
  const pasteShortcut = useMemo(() => getPasteShortcut(), []);
  const config = useMemo(() => getConfig({ providerOverride }), [providerOverride]);

  // Preflight and provider init
  useEffect(() => {
    const issues = checkSetup(config);
    setSetupIssues(issues);
    if (config.provider !== 'fake' && issues.length === 0) {
      try {
        const instance = createProvider(config);
        setProviderInstance(instance);
      } catch (e) {
        setError(e?.message || String(e));
      }
    } else {
      setProviderInstance(null);
    }
  }, [config]);

  // Kick off suggestion when we have a request
  useEffect(() => {
    let timeoutId;
    if (phase === 'thinking' && request) {
      // Simulate thinking delay for smoother UX
      timeoutId = setTimeout(async () => {
        try {
          let suggestion;
          if (config.provider === 'fake' || !providerInstance) {
            suggestion = suggestCommandFromRequest(request);
          } else {
            suggestion = await providerInstance.suggest({ request, cwd: process.cwd(), os: process.platform });
          }
          setResult(suggestion);
          setPhase(suggestion.needsInput ? 'clarify' : 'result');
        } catch (e) {
          setError(e?.message || String(e));
          setPhase('input');
        }
      }, 300);
    }
    return () => clearTimeout(timeoutId);
  }, [phase, request, config.provider, providerInstance]);

  // Copy to clipboard and schedule auto-exit
  useEffect(() => {
    let exitTimer;
    async function doCopyAndMaybeExit() {
      if (phase !== 'result' || !result?.command) return;
      try {
        if (copyToClipboard) {
          await clipboard.write(result.command);
          setCopied(true);
        }
      } catch (e) {
        setCopied(false);
      }
      // Auto-exit shortly after showing result
      exitTimer = setTimeout(() => exit(), 3000);
    }
    doCopyAndMaybeExit();
    return () => clearTimeout(exitTimer);
  }, [phase, result, copyToClipboard, exit]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }
    if (phase === 'result' && key.return) {
      exit();
    }
  });

  // Renders
  const Header = () => (
    React.createElement(
      Box,
      { borderStyle: 'round', borderColor: 'cyan', paddingX: 1, marginBottom: 1 },
      React.createElement(Text, { color: 'cyan', bold: true }, `🛟 HelpMe CLI ${debug ? '(debug)' : ''} — provider: ${config.provider}`)
    )
  );

  const needsSetup = config.provider !== 'fake' && setupIssues.length > 0;

  if (needsSetup) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Header),
      React.createElement(Box, { marginBottom: 1 }, React.createElement(Text, { color: 'red', bold: true }, 'Configuration required')),
      ...setupIssues.map((msg, i) => React.createElement(Box, { key: i }, React.createElement(Text, null, `- ${msg}`))),
      React.createElement(Box, { marginTop: 1 }, React.createElement(Text, { dimColor: true }, 'Create a .env file (see docs/env.example), then re-run: helpme "your request"'))
    );
  }

  if (phase === 'input') {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Header),
      React.createElement(
        Box,
        { marginBottom: 1 },
        React.createElement(Text, null, 'Describe what you want to do, and I will suggest a shell command:')
      ),
      React.createElement(
        Box,
        null,
        React.createElement(Text, { color: 'green' }, '> '),
        React.createElement(TextInput, {
          value: request,
          onChange: setRequest,
          onSubmit: () => setPhase(request ? 'thinking' : 'input'),
          placeholder: 'e.g., use git to pull the latest changes',
        })
      ),
      error && React.createElement(Box, { marginTop: 1 }, React.createElement(Text, { color: 'red' }, error)),
      config.provider === 'fake' && React.createElement(Box, { marginTop: 1 }, React.createElement(Text, { dimColor: true }, 'Tip: Set HELPME_PROVIDER=ollama or gemini in .env to enable real AI.')),
      React.createElement(Box, { marginTop: 1 }, React.createElement(Text, { dimColor: true }, 'Press Enter to submit • Ctrl+C to exit'))
    );
  }

  if (phase === 'thinking') {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Header),
      React.createElement(Box, null, React.createElement(Text, null, 'Thinking…'))
    );
  }

  if (phase === 'clarify') {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Header),
      React.createElement(
        Box,
        { marginBottom: 1 },
        React.createElement(Text, null, result?.question || 'I need a bit more info:')
      ),
      React.createElement(
        Box,
        null,
        React.createElement(Text, { color: 'green' }, '> '),
        React.createElement(TextInput, {
          value: answer,
          onChange: setAnswer,
          onSubmit: () => {
            const refined = `${request} — ${answer}`.trim();
            (async () => {
              try {
                let next;
                if (config.provider === 'fake' || !providerInstance) {
                  next = suggestCommandFromRequest(refined);
                } else {
                  next = await providerInstance.suggest({ request: refined, cwd: process.cwd(), os: process.platform });
                }
                const resolved = next?.command ? next : { command: `echo "${answer.replaceAll('"', '\\"')}"`, explanation: 'Resolution.' };
                setResult(resolved);
                setPhase('result');
              } catch (e) {
                setError(e?.message || String(e));
                setPhase('input');
              }
            })();
          },
          placeholder: 'Type your answer and press Enter',
        })
      ),
      React.createElement(Box, { marginTop: 1 }, React.createElement(Text, { dimColor: true }, 'Press Enter to submit • Ctrl+C to exit'))
    );
  }

  // result
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Header),
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(Text, null, 'Request: '),
      React.createElement(Text, { color: 'green' }, request)
    ),
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(Text, null, 'Suggested command: '),
      React.createElement(Text, { color: 'yellow' }, result?.command || '(none)')
    ),
    result?.explanation && React.createElement(Box, { marginBottom: 1 }, React.createElement(Text, { dimColor: true }, result.explanation)),
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(Text, null, copied ? `Copied to clipboard. Paste with ${pasteShortcut} in your terminal.` : 'Copy to clipboard skipped or failed.')
    ),
    React.createElement(Box, null, React.createElement(Text, { dimColor: true }, 'Press Enter to exit now, or wait a few seconds…'))
  );
}


