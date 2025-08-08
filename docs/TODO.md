# HelpMe CLI — TODO / Spec Backlog

This is a living spec and task list for building the full HelpMe CLI.

## Goals

- Single-turn: User runs `helpme "{request}"` → suggest a single shell command → copy to clipboard → show paste hint → exit.
- Multi-turn fallback: If the task needs a decision or extra info, stay in an interactive TUI and ask clarifying questions.
- Pluggable AI backends: Local (Ollama) and remote (Gemini) per config/env.

## MVP (fake mode) — Current

- Basic Ink TUI that:
  - Reads request from argv or interactive input
  - Generates a fake suggestion (heuristics) and copies to clipboard
  - Shows paste shortcut and exits automatically
- System prompt drafted in `docs/system-prompt.md` (to use when real AI is wired)
- Config loader with `.env` support (`HELPME_PROVIDER`, `OLLAMA_BASE_URL`, `GOOGLE_API_KEY`)

## Next

- Provider abstraction
  - Define `IProvider` with `suggest({ request, cwd, os, history }): Promise<Suggestion>`
  - Implemented: `OllamaProvider`, `GeminiProvider`
  - Add streaming support and timeouts; retries/backoff

- System prompt integration
  - Wired via `src/prompt.js` using `docs/system-prompt.md`
  - JSON parsing/validation via `src/utils/json.js`

- CLI flags
  - `--json` to output machine-readable suggestion (pending)
  - `--no-copy` to skip clipboard (done)
  - `--provider <name>` override (done)
  - `--cwd <path>` target directory context (pending)

- UX polish
  - Spinner/progress while thinking
  - Better formatting for suggested command
  - Optional "Press any key to exit" gate

- Context awareness
  - Detect git repo status and current branch
  - Detect package manager (npm/yarn/pnpm)
  - Expose current project stack (Node/Go/Python) via quick probes

- Error handling
  - Clear guidance when clipboard fails
  - Timeouts with actionable messages
  - First-run setup guidance (done) via `src/setupChecks.js`

- Tests
  - Unit tests for heuristics and config
  - Snapshot tests for Ink screens

- Packaging
  - `npm link` for local global install
  - Publish to npm as `helpme-cli`

## Later

- History and telemetry (opt-in)
- Persistent config at `~/.helpme/config.json`
- Plugin system for domain-specific suggestions (git, docker, k8s, npm, brew)
- Multi-step workflows with preview/apply and safety checks


