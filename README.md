## HelpMe CLI (MVP)

Suggest a shell command from a natural-language request, copy it to the clipboard, show the paste shortcut, and exit. Falls back to interactive questions when needed.

### Install

```bash
cd helpme-cli
npm install
# optional: create a global symlink so `helpme` runs from any terminal
npm link
```

### Usage

```bash
# Single-turn (copies command and exits)
helpme "use git to pull the latest changes"

# Force interactive mode (no argv request)
helpme --interactive

# Options
helpme --no-copy              # skip clipboard
helpme --provider gemini      # when real providers are wired
```

### Unlink / remove the global command

```bash
# remove the global symlink created by `npm link`
npm unlink -g helpme-cli
```

If your terminal does not recognize `helpme` after linking, open a new terminal window or ensure your global npm bin is on PATH (e.g., `$(npm bin -g)`).

### Env / Config

Create a `.env` file (see `docs/env.example`):

```
HELPME_PROVIDER=fake       # or: ollama | gemini
OLLAMA_BASE_URL=http://127.0.0.1:11434
HELPME_OLLAMA_MODEL=llama3.2
GOOGLE_API_KEY=...
GOOGLE_MODEL=gemini-2.5-flash  # or: gemini-1.5-pro
```

### Notes

- This MVP runs in fake mode by default. To enable real AI, set `HELPME_PROVIDER` to `ollama` or `gemini` and fill in the corresponding env vars. If misconfigured, the app will show clear setup instructions on first run.


