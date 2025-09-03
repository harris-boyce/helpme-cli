# Implementation Roadmap

**Document Version**: 1.0  
**Last Updated**: September 2025  
**Document Owner**: Engineering Team  
**Review Cycle**: Bi-weekly (during active development)

---

## Executive Summary

This roadmap builds incrementally on the current working MVP, prioritizing user value delivery over architectural perfection. The approach follows a **crawl-walk-run** strategy that enhances the proven Node.js + Genkit + Ink foundation rather than rewriting working code.

**Current Status**: ✅ **Crawl Phase Complete** - Working MVP with solid foundation  
**Next Phase**: 🚶 **Walk Phase** - Context awareness and UX polish  
**Timeline**: 6-month focused development with community building

---

## Current State Assessment (MVP ✅)

### ✅ What's Working Well
- **Core Workflow**: `helpme "request"` → AI suggestion → clipboard → exit
- **Multi-turn Fallback**: Interactive clarification when needed
- **Provider Abstraction**: Clean Genkit-based switching (Gemini, Ollama)
- **Professional UX**: Ink TUI with React components
- **Configuration System**: `.env` support with sensible defaults
- **Setup Detection**: First-run guidance via `setupChecks.js`

### 📊 Current Capabilities
```javascript
// Working today:
✅ Single-turn command suggestions
✅ Interactive mode with clarifying questions  
✅ Provider switching (--provider gemini|ollama)
✅ Clipboard integration with --no-copy override
✅ Clean error handling and setup validation
✅ Cross-platform Node.js distribution
```

### 🎯 Current Quality Metrics (Baseline)
- **Response Time**: 2-5 seconds (network dependent)
- **Command Accuracy**: Estimated 70-80% (needs measurement)
- **User Experience**: Professional CLI interface
- **Distribution**: npm installable, npm link for development

---

## Phase 1: Context Awareness (Weeks 1-4)

**Goal**: Make suggestions context-aware without breaking existing functionality  
**Priority**: Implement items from `docs/TODO.md` "Next" section

### 🎯 Deliverables

#### 1.1 System Context Detection
**Based on TODO.md priorities**:

```javascript
// src/context/systemContext.js - NEW
export async function collectSystemContext(cwd = process.cwd()) {
  return {
    git: await detectGitStatus(cwd),           // "Detect git repo status and current branch"  
    packageManager: await detectPackageManager(cwd), // "Detect package manager (npm/yarn/pnpm)"
    projectType: await detectProjectStack(cwd), // "Expose current project stack (Node/Go/Python)"
    os: process.platform,
    shell: process.env.SHELL?.split('/').pop() || 'bash',
    cwd: cwd
  };
}

async function detectGitStatus(cwd) {
  try {
    const { execSync } = await import('child_process');
    const branch = execSync('git symbolic-ref --short HEAD', { cwd, stdio: 'pipe' }).toString().trim();
    const hasChanges = execSync('git status --porcelain', { cwd, stdio: 'pipe' }).toString().length > 0;
    
    return { isRepo: true, branch, hasChanges };
  } catch {
    return { isRepo: false };
  }
}
```

**Integration**: Enhance existing `GeminiProvider.js` and `OllamaProvider.js` with context

#### 1.2 Enhanced Provider Interface  
**Modify existing providers**:

```javascript
// src/providers/GeminiProvider.js - MODIFY EXISTING
export class GeminiProvider {
  async suggest({ request, cwd, os, history }) {
    const context = await collectSystemContext(cwd); // NEW
    const system = buildSystemPrompt();
    
    // Enhanced system prompt with context - NEW
    const contextualPrompt = `${system}

Current context:
- Working directory: ${context.cwd}
- OS: ${context.os} (${context.shell} shell)
- Git: ${context.git.isRepo ? `${context.git.branch}${context.git.hasChanges ? ' (modified)' : ' (clean)'}` : 'not a git repository'}
- Project: ${context.projectType || 'unknown project type'}
- Package manager: ${context.packageManager || 'not detected'}

User request: ${request}

Reply ONLY with the JSON object as described.`;

    // Rest stays the same
    const response = await this.ai.generate({
      model: `googleai/${this.model}`,
      prompt: contextualPrompt,
      config: { temperature: 0.2, maxOutputTokens: 512 },
    });

    return parseSuggestionJson(response.text);
  }
}
```

#### 1.3 CLI Flag Enhancement
**From TODO.md**:

```javascript
// src/index.js - MODIFY EXISTING
// Add --cwd <path> support (pending in TODO.md)
// Add --json output support (pending in TODO.md)

const program = {
  cwd: args.cwd || process.cwd(),          // NEW
  provider: args.provider,                 // EXISTING
  noCopy: args.noCopy,                     // EXISTING  
  interactive: args.interactive,           // EXISTING
  json: args.json,                         // NEW
  debug: args.debug                        // EXISTING
};
```

### 🧪 Testing Strategy
```javascript
// tests/context.test.js - NEW
describe('Context Detection', () => {
  test('detects git repository context', async () => {
    const context = await collectSystemContext('./test-fixtures/git-repo');
    expect(context.git.isRepo).toBe(true);
    expect(context.git.branch).toBe('main');
  });
  
  test('detects package.json projects', async () => {
    const context = await collectSystemContext('./test-fixtures/node-project');
    expect(context.projectType).toBe('node');
    expect(context.packageManager).toBe('npm');
  });
});
```

### 📊 Success Metrics
- Context detection accuracy: >90% for common scenarios
- No regression in response time
- Zero breaking changes to existing functionality
- User feedback shows improved suggestion relevance

---

## Phase 2: UX Polish & Reliability (Weeks 5-8)

**Goal**: Professional user experience and production reliability  
**Priority**: Complete TODO.md "Next" section items

### 🎯 Deliverables

#### 2.1 UX Improvements
**From TODO.md UX polish section**:

```javascript
// src/components/ThinkingSpinner.js - NEW
// "Spinner/progress while thinking"
export const ThinkingSpinner = ({ message = "Thinking..." }) => {
  const [frame, setFrame] = useState(0);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, 100);
    return () => clearInterval(timer);
  }, []);
  
  return <Text color="cyan">{frames[frame]} {message}</Text>;
};

// src/components/CommandDisplay.js - NEW  
// "Better formatting for suggested command"
export const CommandDisplay = ({ command, explanation }) => (
  <Box flexDirection="column" marginY={1}>
    <Box>
      <Text color="green" bold>$ </Text>
      <Text color="white" backgroundColor="gray">{` ${command} `}</Text>
    </Box>
    <Box marginTop={1}>
      <Text color="gray" dimColor>{explanation}</Text>
    </Box>
  </Box>
);
```

#### 2.2 Enhanced Error Handling
**From TODO.md "Error handling" section**:

```javascript
// src/utils/errorHandler.js - NEW
export class HelpmeError extends Error {
  constructor(message, type = 'generic', suggestions = []) {
    super(message);
    this.type = type;
    this.suggestions = suggestions;
  }
}

export function handleProviderError(error, config) {
  if (error.message.includes('API key')) {
    return new HelpmeError(
      'Invalid or missing API key',
      'config',
      [
        'Check your .env file has the correct API key',
        'Verify the key has appropriate permissions',
        `For ${config.provider}, you need: ${getRequiredEnvVar(config.provider)}`
      ]
    );
  }
  
  if (error.message.includes('timeout')) {
    return new HelpmeError(
      'Request timed out',
      'network', 
      [
        'Check your internet connection',
        'Try again in a moment',
        'Consider switching providers with --provider flag'
      ]
    );
  }
  
  return error;
}
```

#### 2.3 Provider Enhancements
**From TODO.md "Provider abstraction" improvements**:

```javascript
// src/providers/BaseProvider.js - NEW
export class BaseProvider {
  constructor(config) {
    this.config = config;
    this.retryAttempts = 3;
    this.timeout = 30000;
  }
  
  async suggestWithRetry(params) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await Promise.race([
          this.suggest(params),
          this.timeoutPromise(this.timeout)
        ]);
      } catch (error) {
        if (attempt === this.retryAttempts) throw error;
        await this.exponentialBackoff(attempt);
      }
    }
  }
  
  async exponentialBackoff(attempt) {
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 🧪 Testing Strategy
```javascript
// tests/reliability.test.js - NEW  
describe('Error Handling', () => {
  test('gracefully handles network timeouts', async () => {
    // Mock network timeout scenario
    const result = await provider.suggest({ request: 'test', timeout: 100 });
    expect(result.error).toContain('timeout');
    expect(result.suggestions).toBeArray();
  });
});
```

### 📊 Success Metrics
- Error recovery rate: >95% of errors provide actionable guidance
- User-reported error incidents: <5% of total usage
- Response time consistency: <10% variance from baseline
- Professional UI feedback: Positive user comments on experience

---

## Phase 3: Safety & Production Readiness (Weeks 9-12)

**Goal**: Safe command suggestions and production reliability

### 🎯 Deliverables

#### 3.1 Command Safety Classification

```javascript
// src/safety/commandSafety.js - NEW
export class CommandSafety {
  static SAFETY_LEVELS = {
    SAFE: 'safe',           // ls, cat, git status, npm list
    CAUTIOUS: 'cautious',   // npm install, git push, mkdir
    DANGEROUS: 'dangerous', // rm, sudo, systemctl, docker run
    CRITICAL: 'critical'    // rm -rf, mkfs, dd, sudo rm
  };

  constructor() {
    this.dangerousPatterns = [
      /rm\s+.*-r.*f/,           // rm -rf variations
      /sudo\s+rm/,              // sudo rm anything
      />\s*\/dev\/sd[a-z]/,     // writing to disk devices
      /mkfs/,                   // filesystem creation
      /dd\s+.*of=/,             // dd with output file
    ];
    
    this.cautiousPatterns = [
      /sudo(?!\s+apt\s+list)/,  // sudo (except safe commands)
      /npm\s+install\s+-g/,     // global npm installs
      /pip\s+install/,          // python package installs
      /chmod\s+777/,            // overly permissive permissions
    ];
  }

  classify(command) {
    if (this.dangerousPatterns.some(pattern => pattern.test(command))) {
      return CommandSafety.SAFETY_LEVELS.DANGEROUS;
    }
    
    if (this.cautiousPatterns.some(pattern => pattern.test(command))) {
      return CommandSafety.SAFETY_LEVELS.CAUTIOUS;
    }
    
    return CommandSafety.SAFETY_LEVELS.SAFE;
  }
  
  generateWarning(command, safetyLevel) {
    switch (safetyLevel) {
      case CommandSafety.SAFETY_LEVELS.DANGEROUS:
        return {
          needsConfirmation: true,
          warning: "⚠️  This is a potentially destructive command",
          suggestion: "Make sure you have backups and understand the consequences"
        };
      case CommandSafety.SAFETY_LEVELS.CAUTIOUS:
        return {
          needsConfirmation: true,
          warning: "⚡ This command will modify your system",
          suggestion: "Review the command carefully before proceeding"
        };
      default:
        return { needsConfirmation: false };
    }
  }
}
```

#### 3.2 Enhanced System Prompt with Safety

```javascript
// docs/system-prompt.md - MODIFY EXISTING
// Add safety guidelines to existing prompt:
`
SAFETY GUIDELINES:
- Never suggest destructive commands without explicit user request
- For dangerous operations, include safety warnings in explanation
- Prefer safer alternatives when possible
- If unsure about safety, ask for clarification

Examples:
- Request: "delete all files" 
  Response: {"command": null, "needsInput": true, "question": "This is destructive. Confirm you want to delete all files in current directory?"}

- Request: "remove node_modules"
  Response: {"command": "rm -rf node_modules", "explanation": "⚠️  Removes entire node_modules directory (can be restored with npm install)"}
`
```

#### 3.3 Comprehensive Testing Suite

```javascript
// tests/safety.test.js - NEW
describe('Command Safety', () => {
  const safety = new CommandSafety();
  
  test('classifies dangerous commands correctly', () => {
    expect(safety.classify('rm -rf /')).toBe('dangerous');
    expect(safety.classify('sudo rm important-file')).toBe('dangerous'); 
    expect(safety.classify('ls -la')).toBe('safe');
  });
  
  test('provides appropriate warnings', () => {
    const warning = safety.generateWarning('rm -rf temp', 'dangerous');
    expect(warning.needsConfirmation).toBe(true);
    expect(warning.warning).toContain('destructive');
  });
});

// tests/integration.test.js - NEW
describe('End-to-End Workflows', () => {
  test('complete suggestion workflow', async () => {
    const result = await helpme.suggest({
      request: 'show git status',
      cwd: '/test/git-repo',
      os: 'linux'
    });
    
    expect(result.command).toBe('git status');
    expect(result.explanation).toContain('current');
    expect(result.needsInput).toBe(false);
  });
});
```

### 📊 Success Metrics
- Zero safety incidents reported by users
- 100% of dangerous commands flagged appropriately  
- Test coverage >85% for core functionality
- All integration tests passing consistently

---

## Phase 4: Community & Distribution (Weeks 13-16)

**Goal**: Open source community building and broad distribution

### 🎯 Deliverables

#### 4.1 Package Distribution
**From TODO.md "Packaging" section**:

```javascript
// package.json - MODIFY EXISTING
{
  "name": "helpme-cli",
  "version": "1.0.0",
  "description": "AI-powered CLI assistant for developers",
  "keywords": ["cli", "ai", "developer-tools", "assistant", "productivity"],
  "repository": "github:user/helpme-cli",
  "bugs": "https://github.com/user/helpme-cli/issues",
  "homepage": "https://github.com/user/helpme-cli#readme"
}

// .github/workflows/release.yml - NEW
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: 18 }
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### 4.2 Community Documentation

```markdown
# CONTRIBUTING.md - NEW
## Quick Start
1. Fork and clone the repository
2. `npm install` to install dependencies  
3. `npm link` to install globally for testing
4. `helpme "test command"` to verify it works
5. Make changes and test locally
6. Submit PR with clear description

## Architecture Overview
- `src/providers/` - AI provider implementations
- `src/components/` - Ink React components for TUI
- `src/context/` - System context detection
- `src/safety/` - Command safety classification
- `docs/` - Documentation and system prompts

## Adding New Providers
Implement the `suggest()` interface - see existing providers for examples.

## Testing
- `npm test` - Run all tests
- `npm run test:watch` - Watch mode for development
- Test fixtures in `tests/fixtures/` for consistent testing
```

#### 4.3 Quality Assurance

```javascript
// .github/workflows/ci.yml - NEW
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: ${{ matrix.node }} }
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

### 📊 Success Metrics
- npm package published successfully
- CI/CD pipeline running reliably
- First external contributors making successful PRs
- GitHub community engagement (stars, issues, discussions)

---

## Phase 5: Advanced Features (Weeks 17-24)

**Goal**: MCP integration and advanced workflows  
**Priority**: Items from TODO.md "Later" section

### 🎯 Deliverables

#### 5.1 MCP Tool Integration

```javascript
// src/mcp/mcpManager.js - NEW
export class MCPManager {
  constructor() {
    this.tools = new Map();
    this.initializeStandardTools();
  }
  
  async initializeStandardTools() {
    // Community MCP tools that add specialized context
    const standardTools = [
      { name: 'docker-context', package: '@mcp/docker-context' },
      { name: 'git-workflow', package: '@mcp/git-workflow' },
      { name: 'k8s-helper', package: '@mcp/kubernetes-helper' }
    ];
    
    for (const tool of standardTools) {
      try {
        const mcpTool = await this.loadMCPTool(tool);
        this.tools.set(tool.name, mcpTool);
      } catch (error) {
        console.debug(`MCP tool ${tool.name} not available:`, error.message);
      }
    }
  }
  
  async enhanceContext(request, baseContext) {
    const relevantTools = this.findRelevantTools(request);
    const mcpContext = {};
    
    for (const tool of relevantTools) {
      try {
        mcpContext[tool.name] = await tool.gatherContext(baseContext);
      } catch (error) {
        console.warn(`MCP tool ${tool.name} failed:`, error.message);
      }
    }
    
    return { ...baseContext, mcp: mcpContext };
  }
}
```

#### 5.2 Multi-Step Workflows
**From TODO.md "Later" - "Multi-step workflows"**:

```javascript
// src/workflows/workflowManager.js - NEW
export class WorkflowManager {
  async planWorkflow(request, context) {
    // For complex requests, break into steps
    const workflowPrompt = `
${buildSystemPrompt()}

The user request seems to require multiple steps. Break this into a safe, sequential workflow:

User request: ${request}
Context: ${JSON.stringify(context)}

Respond with JSON:
{
  "isMultiStep": true,
  "steps": [
    {"command": "step 1 command", "explanation": "why this step", "safetyLevel": "safe|cautious|dangerous"},
    {"command": "step 2 command", "explanation": "why this step", "safetyLevel": "safe|cautious|dangerous"}
  ],
  "overallExplanation": "summary of what this workflow accomplishes"
}`;

    const response = await this.provider.ai.generate({
      prompt: workflowPrompt,
      config: { temperature: 0.1, maxOutputTokens: 1000 }
    });
    
    return this.validateWorkflow(parseSuggestionJson(response.text));
  }
}
```

#### 5.3 Persistent Configuration
**From TODO.md "Later" - "Persistent config"**:

```javascript
// src/config/persistentConfig.js - NEW
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

export class PersistentConfig {
  constructor() {
    this.configDir = join(homedir(), '.helpme');
    this.configFile = join(this.configDir, 'config.json');
    this.ensureConfigDirectory();
  }
  
  ensureConfigDirectory() {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
  }
  
  load() {
    try {
      if (existsSync(this.configFile)) {
        return JSON.parse(readFileSync(this.configFile, 'utf8'));
      }
    } catch (error) {
      console.warn('Failed to load config:', error.message);
    }
    
    return this.getDefaults();
  }
  
  save(config) {
    try {
      writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    } catch (error) {
      console.warn('Failed to save config:', error.message);
    }
  }
  
  getDefaults() {
    return {
      defaultProvider: 'gemini',
      safetyLevel: 'normal',
      contextAwareness: true,
      historyRetention: 30, // days
      mcpTools: {
        docker: true,
        git: true,
        kubernetes: false
      }
    };
  }
}
```

### 📊 Success Metrics
- MCP tools successfully providing enhanced context
- Multi-step workflows completing successfully
- User configuration persistence working reliably
- Community contributing MCP tool integrations

---

## Success Metrics & Monitoring

### Development Velocity Metrics
```javascript
// Weekly tracking during development
const devMetrics = {
  completedTasks: 'Tasks from roadmap completed per week',
  codeQuality: 'Test coverage percentage, linting compliance',
  communityEngagement: 'GitHub stars, forks, issues, PRs',
  userFeedback: 'Issue reports, feature requests, positive feedback'
};
```

### Quality Gates (Each Phase)
- **Phase 1**: Context detection accuracy >90%, no performance regression
- **Phase 2**: User error rate <5%, professional UX feedback
- **Phase 3**: Zero safety incidents, >85% test coverage  
- **Phase 4**: Successful npm publish, CI/CD green, external contributors
- **Phase 5**: MCP tools working, multi-step workflows functional

### User Value Metrics
```javascript
const userMetrics = {
  commandAccuracy: 'Percentage of suggestions that work without modification',
  timeToValue: 'Seconds from request to useful command suggestion',
  returnUsage: 'Users who return after first successful use',
  communityGrowth: 'Contributors, npm downloads, GitHub engagement'
};
```

---

## Risk Mitigation & Contingency Plans

### Technical Risks
1. **AI Provider Changes**: Multiple provider support minimizes lock-in
2. **Context Detection Failures**: Graceful degradation to non-contextual suggestions
3. **Performance Degradation**: Benchmarking and optimization at each phase

### Community Risks  
1. **Low Adoption**: Focus on immediate practical value, clear documentation
2. **Maintainer Burden**: Automated testing, clear contributing guidelines
3. **Feature Creep**: Stick to roadmap, evaluate new features against core value

### Quality Risks
1. **Safety Incidents**: Conservative command classification, user confirmations
2. **Broken Suggestions**: Comprehensive testing, user feedback integration
3. **Platform Compatibility**: CI testing on multiple OS and Node.js versions

---

## Post-1.0 Considerations (Future)

### Advanced Capabilities (Future Exploration)
- **Telemetry & Analytics** (opt-in): Anonymous usage patterns for improvement
- **Advanced MCP Ecosystem**: Community-driven specialized tool integrations
- **Team/Organization Features**: Shared configurations, custom system prompts
- **Integration Partnerships**: IDE extensions, terminal integrations

### Technical Evolution
- **Performance Optimization**: Response time improvements, local caching
- **Advanced AI Features**: Code analysis, error diagnosis, performance suggestions
- **Security Enhancements**: Command validation, credential management
- **Accessibility Improvements**: Screen reader support, keyboard navigation

---

## Conclusion

This roadmap builds incrementally on the solid foundation you've already created. Rather than over-engineering, we enhance what works:

✅ **Leverage Current Strengths**: Node.js + Genkit + Ink is excellent  
✅ **Follow TODO.md Priorities**: Your existing plan is sound  
✅ **Community-First Approach**: JavaScript accessibility maximizes contributors  
✅ **Safety-Conscious**: Build user trust through careful command handling  
✅ **Value-Driven**: Each phase delivers immediate user benefits  

The key insight is that your current architecture doesn't need replacement - it needs thoughtful enhancement. This roadmap respects that foundation while systematically building the features that will make `helpme-cli` an indispensable tool for CLI-comfortable developers.

**Next Steps**: Begin Phase 1 with context detection, knowing that each enhancement builds on proven, working code rather than theoretical architectural perfection.

---

*This roadmap serves as a living document that should evolve based on user feedback, community contributions, and real-world usage patterns. Regular review ensures we're building what users actually need rather than what we think they might want.*