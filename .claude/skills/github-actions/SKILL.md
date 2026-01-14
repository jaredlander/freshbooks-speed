# GitHub Actions Workflow Expert

## Purpose
Expert GitHub Actions workflow creation and editing. Use when asked to (1) create or modify GitHub Actions workflows (.github/workflows/*.yml), (2) set up CI/CD pipelines, (3) configure automated testing, deployment, or release workflows, (4) troubleshoot workflow syntax or behavior, (5) implement workflow best practices, or when phrases like "GitHub Actions", "CI/CD pipeline", "workflow", "automated deployment", "continuous integration" appear.

## Core Principles

### 1. Workflow Structure
- Place workflows in `.github/workflows/` directory
- Use clear, descriptive workflow names
- Organize complex workflows with reusable components
- Leverage workflow_call for DRY patterns
- Keep workflows focused and single-purpose when possible

### 2. Trigger Configuration
```yaml
# Common trigger patterns
on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - '!docs/**'  # Exclude paths
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
  workflow_dispatch:  # Manual trigger
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options: [dev, staging, prod]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_call:  # Reusable workflow
    inputs:
      config-path:
        required: true
        type: string
    secrets:
      token:
        required: true
```

### 3. Environment and Secrets
```yaml
env:
  # Workflow-level environment variables
  NODE_VERSION: '20'
  CACHE_KEY_PREFIX: 'npm-cache'

jobs:
  deploy:
    environment:
      name: production
      url: https://example.com
    env:
      # Job-level environment variables
      DEPLOYMENT_REGION: us-east-1
    steps:
      - name: Deploy
        env:
          # Step-level environment variables (highest precedence)
          API_KEY: ${{ secrets.API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Auto-provided
```

**Secret Management:**
- Use repository/organization/environment secrets
- Never hardcode sensitive values
- Reference with `${{ secrets.SECRET_NAME }}`
- GITHUB_TOKEN is automatically available
- Use environments for deployment protection rules

## Job Configuration Best Practices

### Concurrency Control
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel old runs on new push
```

### Matrix Strategies
```yaml
strategy:
  fail-fast: false  # Continue other jobs if one fails
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18, 20, 22]
    include:
      - os: ubuntu-latest
        node-version: 20
        coverage: true
    exclude:
      - os: macos-latest
        node-version: 18
```

### Conditional Execution
```yaml
jobs:
  test:
    if: github.event_name == 'pull_request'
    steps:
      - name: Run tests
        if: success() || failure()  # Run even if previous step failed
      
      - name: Deploy
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

## Common Workflow Patterns

### Node.js CI/CD
```yaml
name: Node.js CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        if: matrix.node-version == '20'
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### Docker Build and Push
```yaml
name: Docker Build

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### R Package CI
```yaml
name: R-CMD-check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ${{ matrix.config.os }}
    strategy:
      fail-fast: false
      matrix:
        config:
          - {os: ubuntu-latest, r: 'release'}
          - {os: ubuntu-latest, r: 'devel'}
          - {os: macos-latest, r: 'release'}
          - {os: windows-latest, r: 'release'}
    steps:
      - uses: actions/checkout@v4
      
      - uses: r-lib/actions/setup-r@v2
        with:
          r-version: ${{ matrix.config.r }}
          use-public-rspm: true
      
      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::rcmdcheck
          needs: check
      
      - uses: r-lib/actions/check-r-package@v2
        with:
          upload-snapshots: true
```

### Deployment with Environments
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: ./deploy.sh staging
        env:
          DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}
  
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: ./deploy.sh production
        env:
          DEPLOY_KEY: ${{ secrets.PRODUCTION_DEPLOY_KEY }}
```

### Reusable Workflow
```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: '20'
      coverage:
        required: false
        type: boolean
        default: false
    secrets:
      codecov-token:
        required: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - name: Upload coverage
        if: inputs.coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.codecov-token }}

# Usage in another workflow:
# jobs:
#   test:
#     uses: ./.github/workflows/reusable-test.yml
#     with:
#       node-version: '22'
#       coverage: true
#     secrets:
#       codecov-token: ${{ secrets.CODECOV_TOKEN }}
```

## Advanced Features

### Caching Strategies
```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ~/.cache/pip
      vendor/bundle
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json', '**/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-deps-

# Action-specific caching (preferred when available)
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Handles caching automatically

- uses: actions/setup-python@v5
  with:
    cache: 'pip'
```

### Artifacts and Outputs
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - name: Get version
        id: version
        run: echo "version=$(cat VERSION)" >> $GITHUB_OUTPUT
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            dist/
            build/
          retention-days: 7

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
      
      - name: Deploy version
        run: echo "Deploying ${{ needs.build.outputs.version }}"
```

### Composite Actions (Custom Actions)
```yaml
# .github/actions/setup-environment/action.yml
name: 'Setup Environment'
description: 'Setup common environment for all jobs'
inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'
    - run: npm ci
      shell: bash
    - run: npm run build
      shell: bash

# Usage:
# - uses: ./.github/actions/setup-environment
#   with:
#     node-version: '22'
```

### Matrix with Dynamic Values
```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: |
          # Generate matrix dynamically
          echo "matrix={\"include\":[{\"env\":\"dev\"},{\"env\":\"staging\"}]}" >> $GITHUB_OUTPUT
  
  deploy:
    needs: prepare
    strategy:
      matrix: ${{ fromJSON(needs.prepare.outputs.matrix) }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to ${{ matrix.env }}"
```

## Security Best Practices

### 1. Permission Management
```yaml
# Workflow-level (most restrictive)
permissions:
  contents: read
  pull-requests: write

jobs:
  job-with-specific-perms:
    permissions:
      contents: write
      packages: write
```

### 2. Pull Request Security
```yaml
# Use pull_request_target carefully - it has write access
on:
  pull_request:  # Safer for external contributions
    types: [opened, synchronize]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # Don't check out untrusted code directly
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
```

### 3. Script Injection Prevention
```yaml
# BAD: Script injection vulnerability
- run: echo "Hello ${{ github.event.issue.title }}"

# GOOD: Use environment variables
- run: echo "Hello $TITLE"
  env:
    TITLE: ${{ github.event.issue.title }}
```

### 4. Third-Party Actions
```yaml
# Pin to specific SHA for security
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1

# Or use tags with verification
- uses: actions/checkout@v4
```

## Performance Optimization

### 1. Reduce Checkout Time
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 1  # Shallow clone
    sparse-checkout: |  # Only checkout needed paths
      src/
      tests/
```

### 2. Parallel Jobs
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]
  
  test:
    runs-on: ubuntu-latest
    steps: [...]
  
  build:
    needs: [lint, test]  # Only run after both complete
    runs-on: ubuntu-latest
    steps: [...]
```

### 3. Self-Hosted Runners
```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, x64, gpu]
    steps: [...]
```

## Debugging and Troubleshooting

### Enable Debug Logging
```yaml
# Set repository secrets:
# ACTIONS_STEP_DEBUG: true
# ACTIONS_RUNNER_DEBUG: true

# Or in workflow:
- name: Debug step
  run: |
    echo "::debug::This is a debug message"
    echo "::warning::This is a warning"
    echo "::error::This is an error"
```

### Job Summaries
```yaml
- name: Generate summary
  run: |
    echo "### Test Results :rocket:" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo "- Tests passed: 42" >> $GITHUB_STEP_SUMMARY
    echo "- Coverage: 87%" >> $GITHUB_STEP_SUMMARY
```

### Annotations
```yaml
- name: Create annotation
  run: |
    echo "::notice file=app.js,line=1,col=5::This is a notice"
    echo "::warning file=app.js,line=10::This is a warning"
    echo "::error file=app.js,line=20,col=15::This is an error"
```

## Common Context Variables

```yaml
# GitHub context
${{ github.repository }}         # owner/repo
${{ github.ref }}                # refs/heads/main
${{ github.sha }}                # commit SHA
${{ github.actor }}              # user who triggered
${{ github.event_name }}         # push, pull_request, etc.
${{ github.run_id }}             # unique run ID
${{ github.run_number }}         # sequential run number

# Runner context
${{ runner.os }}                 # Linux, Windows, macOS
${{ runner.arch }}               # X64, ARM64
${{ runner.temp }}               # temp directory path

# Job context
${{ job.status }}                # success, failure, cancelled

# Steps context
${{ steps.step_id.outputs.name }}

# Needs context (from dependent jobs)
${{ needs.build.outputs.version }}

# Environment files
echo "KEY=value" >> $GITHUB_ENV
echo "name=value" >> $GITHUB_OUTPUT
echo "/custom/path" >> $GITHUB_PATH
```

## Testing Workflows Locally

Use `act` for local testing:
```bash
# Install act
brew install act  # macOS
# or download from https://github.com/nektos/act

# Run workflow
act push
act pull_request
act -j test  # Run specific job

# Use specific event
act -e event.json
```

## Anti-Patterns to Avoid

1. **Don't hardcode secrets**: Always use `${{ secrets.NAME }}`
2. **Don't use `if: always()`** without thought: Can mask real failures
3. **Don't mix concerns**: Keep workflows focused on single purposes
4. **Avoid deep nesting**: Use reusable workflows or composite actions
5. **Don't ignore caching**: Speeds up workflows significantly
6. **Avoid `checkout@v1`**: Always use latest stable versions
7. **Don't run untrusted code** in pull_request_target without sandboxing

## Workflow Templates

Claude Code should offer to create complete, working workflows based on common patterns:
- CI for multiple languages (Node.js, Python, Go, Rust, R, etc.)
- Docker build and push to registries (GitHub, Docker Hub, AWS ECR)
- Deployment workflows (staging/production with approval)
- Release automation (semantic versioning, changelog generation)
- Scheduled tasks (cleanup, backups, reports)
- Monorepo workflows with path filtering

## Output Format

When creating workflows:
1. Generate complete, runnable YAML files
2. Include comments explaining complex sections
3. Suggest relevant repository settings (branch protection, environments)
4. Provide example secret configuration instructions
5. Mention any required repository permissions

When editing workflows:
1. Preserve existing structure and comments
2. Explain changes made
3. Highlight potential breaking changes
4. Suggest testing approach (act, workflow_dispatch)

## Integration Points

- **Posit Products**: Deploy R Shiny apps, build R packages, publish to Posit Connect
- **Docker**: Build and push containers with proper caching
- **R/Python**: Matrix testing across versions, dependency caching
- **Ansible**: Deploy infrastructure, run playbooks with secrets
- **Kubernetes**: Deploy with kubectl, Helm, or Kustomize
- **AWS/Azure/GCP**: Deploy to cloud platforms with OIDC authentication

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
