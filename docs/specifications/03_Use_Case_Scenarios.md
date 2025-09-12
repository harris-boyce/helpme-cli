# Use Case Scenarios Document

**Document Version**: 2.0 (Revised for Execution-Focused UX)  
**Last Updated**: September 2025  
**Document Owner**: UX/Product Team  
**Review Cycle**: Monthly

---

## Overview

This document captures detailed execution-focused user scenarios for `helpme-cli`, organized by persona and operational mode. The system follows **Read-Execute-Print-Terminate (REPT)** philosophy rather than conversational loops, focusing on immediate problem resolution through contextual system integration.

**Core Philosophy**: Intelligent system integration vs. chat interface recreation  
**Key Differentiation**: Executes diagnostics and solutions vs. suggests commands to copy

---

## Mode-Based User Stories

### 🔧 SOLVE Mode: `helpme solve "problem"`
**Purpose**: Diagnostic execution + guided problem resolution  
**Philosophy**: Detect → Diagnose → Execute → Resolve → Exit

---

### 🚨 Emergency Eric (SRE, On-call Engineer) - SOLVE Mode

#### User Story 1: Production Incident Response
**As an** on-call engineer responding to a critical production alert  
**I want** the system to immediately run diagnostics and show me what's actually wrong  
**So that** I can resolve issues in minutes, not hours of manual investigation

**Scenario Context**: 2 AM production alert - API returning 500 errors, customers affected

**Execution Flow**:
```bash
$ helpme solve "API returning 500 errors, customers complaining"

🚨 EMERGENCY MODE DETECTED
🔍 Analyzing production environment... (auto-detected from context)

⚡ Running diagnostics (no confirmation needed in emergency mode):
✓ curl -I https://api.yourcompany.com/health (Response: 502 Bad Gateway)
✓ docker ps --filter "name=api" (3/3 containers running)
✓ docker logs api-1 --since=5m | tail -20 (ERROR: Connection timeout to database)
✓ docker logs api-2 --since=5m | tail -20 (ERROR: Connection timeout to database) 
✓ nc -zv db.yourcompany.com 5432 (Connection refused)

🚨 ROOT CAUSE IDENTIFIED: Database server unreachable
   Impact: All API requests failing (100% error rate)
   Duration: 7 minutes (detected from log timestamps)

💡 IMMEDIATE ACTIONS AVAILABLE:
1. [SAFE - RECOMMENDED] Enable maintenance mode
   Command: ./scripts/maintenance-mode.sh enable
   Effect: Show maintenance page, stop error alerts
   
2. [SAFE] Check database server status  
   Command: ssh db-server 'systemctl status postgresql'
   Effect: Determine if DB is down or network issue
   
3. [ESCALATION] Page database team
   Command: ./scripts/page-oncall.sh database "API outage - DB unreachable"

Execute recommended action (maintenance mode)? [Y/n] y

✅ Executing: ./scripts/maintenance-mode.sh enable
✅ Maintenance mode activated
✅ Customer-facing errors stopped
📋 Incident ID: INC-2025-0903-001 (auto-logged)

🔗 Next steps:
   - Database team paged automatically
   - Status page updated: https://status.yourcompany.com  
   - Run: helpme solve "database server not responding" (next diagnostic)

⏱️  Total resolution time: 1m 23s
```

**Success Criteria**:
- Immediate diagnostic execution without manual steps
- Root cause identified through automated analysis
- Safe mitigation executed automatically
- Clear next steps provided
- Complete incident context preserved

---

#### User Story 2: Kubernetes Emergency Response
**As an** SRE unfamiliar with a specific Kubernetes setup during an incident  
**I want** automated diagnostics that show me exactly what's failing in this cluster  
**So that** I can fix issues even in unfamiliar environments under pressure

**Scenario Context**: Pod CrashLoopBackOff alert on unfamiliar production cluster

**Execution Flow**:
```bash
$ helpme solve "kubernetes pod crashloopbackoff in production"

🚨 KUBERNETES EMERGENCY ANALYSIS
🔍 Cluster context detected:
   - Cluster: prod-east-1 (GKE)
   - Namespace: payment-service  
   - Problem pod: payment-service-deployment-7d4f8b9c-xyz

⚡ Automated diagnostics:
✓ kubectl get pods -n payment-service (1/3 pods failing)
✓ kubectl describe pod payment-service-deployment-7d4f8b9c-xyz
✓ kubectl logs payment-service-deployment-7d4f8b9c-xyz --previous
✓ kubectl get deployment payment-service-deployment -o yaml

🚨 CRITICAL ISSUE: Out of Memory (OOMKilled)
   Memory limit: 256Mi
   Memory usage at failure: 312Mi
   Restart count: 47 times in last 10 minutes

📊 RESOURCE ANALYSIS:
   - Other pods in namespace using 400-500Mi successfully
   - Recent deployment changed memory limit from 512Mi to 256Mi  
   - This change happened 12 minutes ago (matches failure timeline)

💡 SOLUTION OPTIONS:
1. [SAFE] Immediate relief - Scale horizontally
   Command: kubectl scale deployment payment-service-deployment --replicas=5
   Effect: Distribute load across more pods, reduce memory per pod
   
2. [RECOMMENDED] Fix root cause - Restore memory limit
   Command: kubectl patch deployment payment-service-deployment -p '{"spec":{"template":{"spec":{"containers":[{"name":"payment-service","resources":{"limits":{"memory":"512Mi"}}}]}}}}'
   Effect: Return to previous working memory allocation

3. [INVESTIGATE] Check for memory leaks (if problem persists)
   Command: kubectl top pods -n payment-service --containers

Execute option 2 (restore memory limit)? [Y/n] y

✅ Patching deployment...
✅ Deployment updated: memory limit restored to 512Mi
✅ Pods restarting with new configuration...

🔄 Monitoring pod recovery:
✓ New pod: payment-service-deployment-8e5f9a1d-abc (Running)
✓ Health check: curl payment-service:8080/health (200 OK)
✓ No crash loops detected for 60 seconds

✅ INCIDENT RESOLVED
   - Payment service operational
   - Memory limit restored to working configuration  
   - No customer impact (other pods handled traffic during restart)

⏱️  Total resolution time: 2m 41s
📋 Post-incident: Review deployment change that caused issue
```

**Success Criteria**:
- Unfamiliar cluster navigated automatically
- Resource analysis performed without manual calculation
- Root cause identified through historical analysis
- Safe solution executed with monitoring
- Complete resolution achieved with minimal cluster knowledge required

---

### 🤯 Frustrated Felix (Senior Developer, DevOps Engineer) - SOLVE Mode

#### User Story 3: Development Environment Issues
**As a** senior developer whose Docker setup suddenly broke  
**I want** the system to diagnose and fix the issue immediately  
**So that** I can get back to coding instead of debugging environment problems

**Scenario Context**: Felix's Docker container won't start with cryptic error, blocking development work

**Execution Flow**:
```bash
$ helpme solve "docker container won't start: exec format error"

🔍 Docker environment analysis:
   - Host: Apple M1 Pro (arm64)
   - Docker Desktop: 4.15.0
   - Image: user-api:latest

⚡ Container diagnostics:
✓ docker images user-api:latest --format "{{.Architecture}}"
✓ docker image inspect user-api:latest | jq '.Architecture'  
✓ docker buildx ls (checking builder support)

🚨 ARCHITECTURE MISMATCH DETECTED:
   Image architecture: linux/amd64
   Host architecture: linux/arm64
   
   Root cause: Image was built on/for Intel architecture
   but you're running on Apple Silicon (M1)

💡 SOLUTION: Rebuild image for ARM64

🔧 Auto-executing fix (safe operation):
✓ docker buildx build --platform linux/arm64 -t user-api:latest .
✓ Multi-arch build completed (2m 15s)
✓ docker run --rm user-api:latest echo "Architecture test" (Success!)

✅ PROBLEM RESOLVED:
   - Image rebuilt for ARM64 architecture
   - Container now starts successfully
   - Development environment operational

💡 PREVENTION: Add to your Dockerfile:
   FROM --platform=$TARGETPLATFORM node:18
   
   Or use multi-arch build by default:
   docker buildx build --platform linux/amd64,linux/arm64 -t user-api:latest .

⏱️  Time saved: ~15 minutes of Stack Overflow searching
📚 Reference: Docker multi-architecture builds guide
```

**Success Criteria**:
- Technical issue diagnosed without manual investigation
- Solution automatically executed (safe rebuild)
- Problem completely resolved, not just identified
- Prevention advice provided for future
- Significant time savings over manual troubleshooting

---

#### User Story 4: Git Workflow Confusion
**As a** senior developer dealing with a complicated merge conflict  
**I want** the system to analyze the conflict and execute the resolution strategy  
**So that** I can resolve conflicts without consulting documentation or colleagues

**Scenario Context**: Complex merge conflict in package.json with team member's branch

**Execution Flow**:
```bash
$ helpme solve "git merge conflict in package.json, multiple dependencies affected"

🔍 Git repository analysis:
   - Current branch: feature/payment-integration
   - Merging branch: feature/user-auth (origin/feature/user-auth)
   - Conflict files: package.json, package-lock.json
   - Team: 4 contributors detected

⚡ Conflict analysis:
✓ git status --porcelain (identifying conflict files)
✓ git diff --name-only --diff-filter=U (unmerged files)
✓ git log --oneline feature/payment-integration..origin/feature/user-auth

🚨 DEPENDENCY CONFLICTS DETECTED:
   
   Conflicting dependencies:
   - express: 4.18.1 (your branch) vs 4.18.2 (their branch)  
   - jsonwebtoken: 8.5.1 (your branch) vs 9.0.0 (their branch) ⚠️ MAJOR
   - mongoose: 6.7.2 (both branches) ✓ NO CONFLICT
   
   Conflicting devDependencies:
   - jest: 29.3.1 (your branch) vs 29.4.0 (their branch)

📊 SMART RESOLUTION STRATEGY:
   1. Accept newer versions for patch/minor updates (express, jest)
   2. Investigate major version change (jsonwebtoken 8→9) for breaking changes
   3. Preserve both branches' new dependencies

🔧 Executing intelligent merge resolution:

✅ Step 1: Research breaking changes
✓ Checking jsonwebtoken changelog (v8 vs v9)
✓ Analyzing your codebase usage: grep -r "jsonwebtoken" src/
   
   🚨 BREAKING CHANGE DETECTED:
   jsonwebtoken v9 changes callback signature
   Your code uses old callback pattern in: src/auth/jwt.js:23

💡 RESOLUTION OPTIONS:
1. [SAFE] Keep v8.5.1 and update their branch  
   Effect: Avoid breaking changes, coordinate with auth team
   
2. [REQUIRES CHANGES] Upgrade to v9.0.0
   Effect: Need to update src/auth/jwt.js callback handling
   Command: Update 'jwt.sign(payload, secret, callback)' pattern

3. [RECOMMENDED] Stage compromise - use v8.5.1 now, plan v9 upgrade
   Effect: Resolve conflict immediately, schedule proper upgrade

Execute option 3 (compromise solution)? [Y/n] y

✅ Applying intelligent merge resolution:
✓ git checkout --theirs package.json (accepting their structure)
✓ Manual merge: updating dependencies to compromise versions
✓ npm install (verifying dependency resolution)
✓ npm test (ensuring no broken tests)

✅ MERGE CONFLICT RESOLVED:
   - Dependencies: express@4.18.2, jsonwebtoken@8.5.1, jest@29.4.0
   - No breaking changes introduced  
   - All tests passing
   - Ready to commit resolution

📋 NEXT STEPS:
   - Coordinate jsonwebtoken v9 upgrade with auth team
   - Schedule tech debt ticket for proper upgrade
   - Document compromise decision in commit message

⏱️  Resolution time: 3m 47s vs ~30-45 minutes manual research
```

**Success Criteria**:
- Complex dependency conflicts analyzed automatically
- Breaking changes detected through code analysis
- Intelligent compromise solution executed
- Verification steps completed automatically
- Team coordination needs identified

---

### 🌱 Curious Clara (Junior to Mid-level Developer) - LEARN Mode

#### User Story 5: Contextual Learning with Practice
**As a** junior developer trying to understand Docker concepts  
**I want** explanations using my actual project and environment  
**So that** I can learn through hands-on practice instead of abstract examples

**Scenario Context**: Clara wants to learn Docker but needs practical, relevant guidance

**Execution Flow**:
```bash
$ helpme learn "docker concepts for my current project"

📚 CONTEXTUAL DOCKER LEARNING

🔍 Analyzing your current project:
   - Project: react-todo-app (detected from package.json)
   - Stack: React + Node.js + Express API
   - Current setup: No containerization detected
   - Team size: 2 developers (git contributors)

🎯 DOCKER CONCEPTS FOR YOUR REACT APP:

📦 **1. CONTAINERS vs VIRTUAL MACHINES**
   Container = Your app + just enough OS to run it
   VM = Entire operating system + your app
   
   For your todo app:
   - Container: ~100MB (Node.js + your code)
   - VM: ~2GB (full OS + Node.js + your code)

🏗️ **2. DOCKERFILE = RECIPE FOR YOUR APP**
   Creates reproducible environment for react-todo-app

   Here's what YOUR Dockerfile would look like:
   ```dockerfile
   FROM node:18-alpine          # Base: lightweight Node.js
   WORKDIR /app                # Set working directory  
   COPY package*.json ./       # Copy dependency files first
   RUN npm install            # Install dependencies
   COPY . .                   # Copy your source code
   EXPOSE 3000                # Your React app runs on port 3000
   CMD ["npm", "start"]       # Command to start your app
   ```

🧪 **LET'S PRACTICE WITH YOUR PROJECT:**

✅ Step 1: Create Dockerfile for your app
✓ Dockerfile created (see above) in your project root

✅ Step 2: Build image with your project name  
✓ docker build -t react-todo-app .

✅ Step 3: Run YOUR container
✓ docker run -p 3000:3000 react-todo-app

🎉 **YOUR APP IS NOW CONTAINERIZED!**
   - Visit: http://localhost:3000 (same as before, but now in container)
   - Container name: react-todo-app
   - Status: docker ps (shows your running container)

🔧 **PRACTICAL BENEFITS FOR YOUR WORKFLOW:**

1. **Environment Consistency**: "Works on my machine" → "Works everywhere"
   Your teammate can run: docker run react-todo-app
   
2. **Easy Deployment**: Same container runs locally and in production
   
3. **Dependency Isolation**: No more npm version conflicts between projects

🧪 **TRY THESE COMMANDS NOW (safe to experiment):**
```bash
# See your running container
docker ps

# Check logs from your containerized app  
docker logs <container-name>

# Stop the container when you're done
docker stop <container-name>

# Remove the container (keeps the image)
docker rm <container-name>
```

📚 **NEXT LEARNING STEPS:**
1. Docker Compose (run React + API + Database together)
2. Multi-stage builds (smaller production images)  
3. Docker volumes (persistent data)

⏱️  Learning time: 5 minutes hands-on vs 30+ minutes reading docs
🎯 You now have a working containerized version of your actual project!
```

**Success Criteria**:
- Concepts explained using student's actual project
- Immediate hands-on practice with real code
- Working result (containerized app) achieved
- Clear progression path for advanced topics
- Confidence built through successful execution

---

#### User Story 6: Safe Experimentation Environment
**As a** mid-level developer wanting to try new technologies  
**I want** guided experimentation that won't break my working environment  
**So that** I can learn safely while building confidence with unfamiliar tools

**Scenario Context**: Clara wants to try Kubernetes but fears breaking things

**Execution Flow**:
```bash
$ helpme learn "kubernetes basics with my containerized app"

📚 SAFE KUBERNETES LEARNING ENVIRONMENT

🔍 Prerequisites check:
   ✓ Docker installed and running
   ✓ Container image available: react-todo-app  
   ⚠️  Kubernetes not detected locally

🛡️ **SAFE LEARNING SETUP** (won't affect your system):
   We'll use Docker Desktop's built-in Kubernetes (isolated sandbox)

✅ Setting up safe K8s environment:
✓ Enabling Docker Desktop Kubernetes (Settings → Kubernetes → Enable)
✓ Waiting for cluster ready... (1m 23s)
✓ kubectl available: kubectl version --client

🎯 **KUBERNETES CONCEPTS WITH YOUR APP:**

📱 **1. PODS = RUNNING CONTAINERS**
   Your react-todo-app container will run inside a "pod"
   Pod = wrapper around your container + networking + storage

🎮 **LET'S CREATE YOUR FIRST POD:**
```yaml
# pod.yaml (created for your app)
apiVersion: v1
kind: Pod  
metadata:
  name: todo-app-pod
spec:
  containers:
  - name: react-app
    image: react-todo-app
    ports:
    - containerPort: 3000
```

✅ Applying to your local cluster (completely safe):
✓ kubectl apply -f pod.yaml
✓ kubectl get pods (Status: Running)

🌐 **2. SERVICES = NETWORKING**
   Service = stable way to reach your pod (pods get random IPs)

✅ Exposing your app through a service:
✓ kubectl expose pod todo-app-pod --port=3000 --target-port=3000 --name=todo-service
✓ kubectl get services

🔗 **ACCESS YOUR KUBERNETES-DEPLOYED APP:**
✓ kubectl port-forward service/todo-service 8080:3000

🎉 **SUCCESS!** Your React app now running in Kubernetes:
   - Visit: http://localhost:8080  
   - Same app, now managed by Kubernetes
   - Zero impact on your regular development setup

🧪 **SAFE EXPERIMENTS YOU CAN TRY:**
```bash
# See your pod details  
kubectl describe pod todo-app-pod

# Check pod logs (same as docker logs)
kubectl logs todo-app-pod

# Scale to multiple pods (try it!)
kubectl scale --replicas=3 deployment/todo-app

# Delete everything when done (completely safe)
kubectl delete pod todo-app-pod
kubectl delete service todo-service
```

🛡️ **SAFETY GUARANTEES:**
   ✅ Everything runs in Docker Desktop's isolated K8s
   ✅ Won't affect your regular Docker containers
   ✅ Can disable K8s in Docker settings anytime
   ✅ Original react-todo-app still works normally

📚 **WHAT YOU LEARNED:**
   - Pods hold your containers
   - Services provide stable networking  
   - kubectl is the control tool
   - Your existing app works in Kubernetes!

⏱️  Safe learning achieved in 8 minutes vs hours of documentation reading
🎯 You now understand Kubernetes basics through hands-on experience!
```

**Success Criteria**:
- Safe, isolated learning environment created automatically
- Real application used for practical learning
- Multiple Kubernetes concepts demonstrated practically
- Complete safety guarantees provided and maintained
- Confidence built through successful hands-on experience

---

### ⚡ QUICKLY Mode: `helpme quickly solve "problem"`
**Purpose**: Expedited execution with minimal confirmation  
**Philosophy**: Speed-optimized diagnosis and resolution

#### User Story 7: Rapid Issue Resolution (All Personas)
**As a** developer under time pressure  
**I want** immediate problem diagnosis and automatic safe fixes  
**So that** I can resolve issues in seconds, not minutes

**Scenario Context**: Demo in 10 minutes, Docker container won't start

**Execution Flow**:
```bash
$ helpme quickly solve "docker container won't start, demo in 10 minutes"

⚡ QUICK MODE: Minimal confirmations, maximum speed

🔍 Rapid diagnosis:
✓ docker ps -a (0.1s)
✓ docker logs container-name --tail=10 (0.2s)

🚨 ERROR: "port 3000 already in use"

🔧 Auto-executing safe fix:
✓ lsof -ti:3000 | xargs kill -9 (0.1s)
✓ docker start container-name (1.2s)
✓ curl localhost:3000/health (0.3s) → 200 OK

✅ RESOLVED: Container running, port 3000 available
⏱️  Total time: 2.1 seconds
🎯 Demo ready!
```

**Success Criteria**:
- Sub-3-second problem resolution
- Zero manual confirmations for safe operations  
- Immediate verification of fix
- Optimized output for speed reading

---

## Cross-Mode Interaction Patterns

### Execution Safety Levels
- **AUTO-EXECUTE**: Read-only diagnostics, safe operations
- **CONFIRM-EXECUTE**: System changes, potentially risky operations  
- **MANUAL-ONLY**: Destructive operations, complex decisions

### Context Intelligence Patterns
- **Environment Detection**: Git repos, Docker, Kubernetes, project types
- **Problem Domain Mapping**: Network, database, container, code issues
- **Tool Availability**: What commands/tools are available for execution
- **Safety Assessment**: Risk level of proposed diagnostic and solution commands

### Learning Integration
- **Contextual Teaching**: Explanations using user's actual environment
- **Practice Opportunities**: Safe commands to try immediately  
- **Progressive Complexity**: Build from current skill level
- **Real Application**: Always use user's actual projects for examples

---

## Success Metrics by Mode

### SOLVE Mode Metrics
- **Diagnostic Accuracy**: >90% correct problem identification
- **Resolution Rate**: >80% problems fully resolved without user intervention
- **Safety Record**: 100% safe command classification and execution
- **Time to Resolution**: <60 seconds average including execution time

### LEARN Mode Metrics  
- **Contextual Relevance**: >95% examples relevant to user's actual environment
- **Hands-on Success**: >85% practice exercises completed successfully
- **Skill Building**: Users report confidence improvement in follow-up surveys
- **Reference Usage**: >70% users follow provided learning resources

### QUICKLY Mode Metrics
- **Speed Enhancement**: >75% faster than normal SOLVE mode
- **Safety Maintenance**: Zero increase in safety incidents despite speed focus
- **User Trust**: >60% users comfortable with automatic execution
- **Error Recovery**: 100% graceful handling when quick solutions fail

---

## Mode Selection Intelligence

### Automatic Mode Detection
```javascript
// System detects user intent and suggests appropriate mode
const modeDetection = {
  emergency: /urgent|critical|production|down|customers|outage/i,
  learning: /learn|understand|explain|teach|how does|what is/i,
  quick: /quickly|fast|demo|meeting|hurry|now/i,
  solve: /broken|error|failing|won't work|not working/i
};

// User examples:
"kubernetes pod crashloopbackoff" → suggests: helpme solve
"explain docker networking" → suggests: helpme learn  
"quick fix for port conflict" → suggests: helpme quickly solve
```

### Mode Switching Recommendations
- **SOLVE → LEARN**: When solution requires understanding concepts
- **LEARN → SOLVE**: When tutorial suggests trying practical application
- **SOLVE → QUICKLY**: When user indicates time pressure during execution
- **QUICKLY → SOLVE**: When quick fixes fail and deeper diagnosis needed

---

*This document represents execution-focused user scenarios that differentiate helpme-cli from conversational AI tools. Each scenario emphasizes immediate problem resolution through intelligent system integration rather than suggestion-based assistance.*

---

### 🌱 Curious Clara (Junior to Mid-level Developer, IT Professional)

#### User Story 4: Learning-Oriented Assistance
**As a** junior developer learning cloud technologies  
**I want** explanations that help me understand concepts, not just solve immediate problems  
**So that** I can build my knowledge and become more independent over time

**Scenario Context**: Clara needs to set up CI/CD for her first project but doesn't fully understand the concepts.

**Interaction Flow**:
```bash
$ helpme "I need to set up CI/CD for my node.js project but I'm new to this, can you explain and help?"

🤖 Great question! Let me explain CI/CD and help you set it up 📚
   
   **CI/CD Basics:**
   - CI (Continuous Integration): Automatically test code when you push changes
   - CD (Continuous Deployment): Automatically deploy tested code
   
   **For your Node.js project, here's a beginner-friendly approach:**
   
   1. **GitHub Actions** (free, integrated, beginner-friendly)
   2. **Basic workflow**: Push → Test → Deploy
   
   **Learning Path:**
   Step 1: Create .github/workflows/ci.yml (I'll guide you)
   Step 2: Add tests (npm test)
   Step 3: Deploy to platform (Vercel/Netlify/Heroku)
   
   Want to start with Step 1? I'll create the file and explain each part.
   
   [Start Tutorial] [Show Examples] [Explain Concepts] [Quick Setup]
```

**Success Criteria**:
- Educational explanations included
- Step-by-step learning path
- Confidence-building approach

---

#### User Story 5: Safe Experimentation
**As a** mid-level developer trying new tools  
**I want** to experiment safely with clear understanding of what each command does  
**So that** I can learn without fear of breaking my development environment

**Scenario Context**: Clara wants to try Docker but is worried about messing up her local environment.

**Interaction Flow**:
```bash
$ helpme "I want to try docker but I'm worried about messing up my system, help me start safely"

🤖 Smart approach! Let's start Docker safely 🛡️
   
   **Safe Learning Strategy:**
   ✅ We'll use isolated containers (won't affect your system)
   ✅ I'll explain each command before we run it
   ✅ Easy cleanup - nothing permanent until you're ready
   
   **Beginner-Safe First Steps:**
   
   1. **Check if Docker is installed:**
      ```bash
      docker --version  # Just checks, doesn't change anything
      ```
   
   2. **Your first safe container (Hello World):**
      ```bash
      docker run hello-world  # Downloads & runs test container
      ```
      ↳ This downloads a tiny test image and runs it once
      ↳ Completely isolated from your system
      ↳ Automatically stops and can be easily removed
   
   **What this WON'T do:**
   ❌ Won't modify your files
   ❌ Won't change your system settings  
   ❌ Won't interfere with other applications
   
   Ready to try step 1?
   [Execute Safely] [Explain More] [Show What Each Command Does]
```

**Success Criteria**:
- Explicit safety explanations
- Clear impact statements
- Non-intimidating progression

---

#### User Story 6: Skill Building Through Context
**As a** developer working on a team project  
**I want** to understand not just what to do, but why certain approaches are better  
**So that** I can contribute more effectively and make better decisions independently

**Scenario Context**: Clara's team uses Git workflows she doesn't fully understand, and she wants to learn proper branching strategies.

**Interaction Flow**:
```bash
$ helpme "my team uses git flow but I don't really understand it, can you explain and show me what to do?"

🤖 Git Flow is a branching strategy! Let me explain the 'why' and 'how' 🌟
   
   **Why teams use Git Flow:**
   - **Parallel Development**: Multiple features without conflicts
   - **Stable Releases**: main/master always deployable
   - **Code Review**: Feature branches enable peer review
   - **Rollback Safety**: Easy to undo specific features
   
   **Your Team's Likely Workflow:**
   ```
   main (production) ←─── release/1.2 ←─── develop ←─── feature/login-ui
                                                    ←─── feature/api-auth
   ```
   
   **For your current task, you probably want:**
   ```bash
   git checkout develop                    # Start from latest development
   git pull origin develop                 # Get latest changes  
   git checkout -b feature/your-task-name  # Create your feature branch
   ```
   
   **Why this approach:**
   - Your changes don't affect others until ready
   - Team can review your work before merging
   - Easy to switch between different features
   
   What's your current task? I'll show you the specific commands.
   [Show My Workflow] [Explain Team Setup] [Practice Commands]
```

**Success Criteria**:
- Educational context provided
- Team workflow explanation
- Practical application to current task

---

### 🚨 Emergency Eric (On-call Engineer, System Administrator)

#### User Story 7: Crisis Situation Support
**As an** on-call engineer responding to a production incident  
**I want** immediate, accurate diagnosis and action steps  
**So that** I can resolve critical issues quickly and minimize downtime

**Scenario Context**: Eric gets paged at 2 AM - the main API is down, customers are complaining, and he needs to diagnose quickly.

**Interaction Flow**:
```bash
$ helpme "URGENT: API is down, 500 errors, need help NOW"

🚨 **EMERGENCY MODE ACTIVATED** 
   
   **Immediate Actions Checklist:**
   
   1. **Check system status** (30 seconds):
      ```bash
      helpme run-diagnostics --critical-path
      ```
      ↳ Checking: servers, database, load balancer, DNS
   
   **RESULTS - ISSUE FOUND:**
   🔴 Database connection pool exhausted (40/40 connections used)
   🔴 API response time: 15s (normal: 200ms)  
   🟢 Servers healthy, load balancer healthy
   
   **IMMEDIATE FIXES (choose one):**
   
   A. **Quick Fix** (2 minutes):
      ```bash
      kubectl scale deployment api --replicas=6  # Double API instances
      ```
      ↳ Reduces load per instance, may restore service
   
   B. **Database Fix** (5 minutes):
      ```bash
      # Restart DB connection pool
      kubectl rollout restart deployment api
      ```
      ↳ Clears stuck connections, restores normal operation
   
   **Which fix do you want to execute?**
   [A - Quick Scale] [B - Restart Services] [Show More Options] [Call Escalation]
```

**Success Criteria**:
- Immediate emergency mode recognition
- Fast diagnosis with clear results
- Multiple fix options with time estimates
- One-click execution options

---

#### User Story 8: Unfamiliar System Emergency
**As an** engineer covering for a colleague during an incident  
**I want** guidance for systems I'm not familiar with  
**So that** I can effectively troubleshoot without accidentally making things worse

**Scenario Context**: Eric is covering oncall for the infrastructure team and gets an alert about a Kubernetes cluster he's never managed before.

**Interaction Flow**:
```bash
$ helpme "kubernetes cluster alert: pod crashloopbackoff, I don't know this system well"

🆘 **UNFAMILIAR SYSTEM SUPPORT**
   
   **Safe Investigation Mode** (won't change anything):
   
   1. **Understanding your situation:**
      ```bash
      kubectl get pods --all-namespaces | grep -i crash
      ```
      ↳ This ONLY shows information, makes no changes
   
   **FOUND:** payment-service pod failing in production namespace
   
   2. **Safe diagnostic commands:**
      ```bash
      kubectl describe pod payment-service-xxx -n production  # View pod details
      kubectl logs payment-service-xxx -n production --tail=50  # Recent logs
      ```
   
   **DIAGNOSIS:** Out of Memory (OOMKilled)
   
   **Your options (I'll explain risks):**
   
   🟢 **SAFE - Get more info:**
      - Check resource limits and usage
      - Review recent deployments  
      - Contact payment team lead
   
   🟡 **MEDIUM RISK - Restart pod:**
      - May temporarily fix issue
      - Could mask underlying problem
      - Safe for most applications
   
   🔴 **HIGHER RISK - Scale resources:**
      - Could affect cluster capacity
      - Requires change approval
      - Should involve system owner
   
   **Recommendation for unfamiliar system:** Start with SAFE option
   [Show Safe Commands] [Get Team Contact] [Document for Handoff]
```

**Success Criteria**:
- Clear risk levels for all suggestions
- Safe investigation commands first
- Escalation paths provided
- No destructive actions without explicit confirmation

---

#### User Story 9: Documentation Under Pressure
**As an** engineer resolving a critical incident  
**I want** to quickly document actions and findings  
**So that** I can maintain incident response best practices even under time pressure

**Scenario Context**: Eric has resolved a critical issue but needs to document the incident for the post-mortem and team learning.

**Interaction Flow**:
```bash
$ helpme "need to document what I just did for incident response, can you help structure this quickly?"

📝 **INCIDENT DOCUMENTATION ASSISTANT**
   
   I'll help you capture this while it's fresh! Quick questions:
   
   1. **Incident Summary** (auto-detected from your recent commands):
      - Time: 02:14 AM - 02:47 AM EST (33 minutes)
      - Issue: API 500 errors, database connection exhaustion
      - Impact: Customer-facing API unavailable
      - Resolution: Scaled API pods, restarted connection pools
   
   2. **Your Actions** (from command history):
      ✅ Diagnosed with system checks
      ✅ Identified root cause (DB connections)
      ✅ Applied temporary fix (scaling)
      ✅ Applied permanent fix (connection restart)
      ✅ Verified resolution
   
   **Generated Incident Report:**
   ```markdown
   # Incident Report - API Outage 
   **Date:** Sep 3, 2025 02:14-02:47 EST
   **Severity:** P1 (Customer Impact)
   **Status:** Resolved
   
   ## Summary
   Production API experienced complete outage due to database 
   connection pool exhaustion...
   ```
   
   Want me to:
   [Complete Report] [Add Timeline] [Generate Action Items] [Prepare for Post-Mortem]
```

**Success Criteria**:
- Auto-captures recent actions
- Structured incident documentation
- Fast generation under pressure
- Prepares for follow-up processes

---

## Cross-Persona Interaction Patterns

### Progressive Complexity Support
- **Entry Level**: Simple commands, extensive explanation
- **Intermediate**: Balanced guidance with options
- **Expert Level**: Concise, multiple approaches, environment-aware

### Emotional Intelligence Patterns
- **Frustration Recognition**: Calm, direct responses
- **Learning Mode**: Encouraging, educational context
- **Crisis Mode**: Urgent, clear, risk-aware

### Safety and Trust Building
- **Permission Requests**: Always ask before executing commands
- **Impact Explanation**: Clear consequences of actions
- **Rollback Options**: Always provide undo paths
- **Confidence Levels**: Express uncertainty when appropriate

---

## Scenario Categories

### Complexity Levels

#### 🟢 Trivial (0-30 seconds)
- Quick syntax lookups
- Simple command reminders  
- Basic status checks
- Common parameter explanations

#### 🟡 Moderate (30 seconds - 5 minutes)
- Multi-step configurations
- Environment-specific guidance
- Tool comparisons and recommendations
- Learning-oriented explanations

#### 🔴 Complex (5+ minutes)
- System integrations
- Architecture decisions
- Crisis troubleshooting
- Advanced workflow optimization

#### 🚨 Emergency (Immediate response)
- Production incidents
- Security alerts
- System failures
- Data recovery scenarios

---

## Success Metrics by Scenario Type

### User Satisfaction Metrics
- **Frustration Reduction**: Before/after stress level measurement
- **Task Completion Rate**: Successful resolution percentage
- **Learning Outcomes**: Knowledge retention for Curious Clara scenarios
- **Time to Resolution**: Speed metrics by complexity level

### Safety Metrics
- **Safe Command Ratio**: Percentage of read-only suggestions first
- **Rollback Success**: Recovery from failed operations
- **Permission Requests**: User consent before system changes
- **Risk Communication**: Clear impact explanation success

### Engagement Metrics
- **Progressive Usage**: Users advancing from simple to complex queries
- **Return Usage**: Users coming back for similar scenario types
- **Educational Value**: Users reporting skill improvement
- **Community Building**: Scenario sharing and collaboration

---

*This document represents core user scenarios and will be updated based on user research and feedback. Each scenario should be validated with representative users from each persona group.*