#!/usr/bin/env node
import 'dotenv/config';
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

function parseArgs(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (!token) continue;
    if (token === '--debug') flags.debug = true;
    else if (token === '--no-copy') flags.copy = false;
    else if (token === '--interactive' || token === '-i') flags.interactive = true;
    else if (token.startsWith('--provider=')) flags.provider = token.split('=')[1];
    else if (token === '--provider') { flags.provider = args[i + 1]; i += 1; }
    else positional.push(token);
  }
  return { flags, request: positional.join(' ').trim() };
}

const { flags, request } = parseArgs(process.argv.slice(2));

const { unmount } = render(
  React.createElement(App, {
    initialRequest: flags.interactive ? '' : request,
    debug: Boolean(flags.debug),
    copyToClipboard: flags.copy !== false,
    providerOverride: flags.provider || undefined,
  })
);

function gracefulExit() {
  try { unmount(); } catch {}
  process.exit(0);
}

process.on('SIGTERM', gracefulExit);
process.on('SIGINT', gracefulExit);


