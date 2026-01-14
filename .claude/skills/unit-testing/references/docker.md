# Docker Testing

## Testing Tools Overview

| Tool | Purpose | Scope |
|------|---------|-------|
| **hadolint** | Dockerfile linting | Syntax, best practices |
| **container-structure-test** | Built image testing | Contents, commands, metadata |
| **trivy** | Security scanning | Vulnerabilities, misconfigs |
| **dive** | Image efficiency | Layer analysis |

## hadolint (Dockerfile Linting)

### Installation

```bash
# Binary
curl -sL https://github.com/hadolint/hadolint/releases/latest/download/hadolint-Linux-x86_64 -o hadolint
chmod +x hadolint
sudo mv hadolint /usr/local/bin/

# Docker
docker pull hadolint/hadolint
```

### Usage

```bash
# Lint Dockerfile
hadolint Dockerfile

# Lint with specific rules ignored
hadolint --ignore DL3008 --ignore DL3009 Dockerfile

# Different output formats
hadolint --format json Dockerfile
hadolint --format sarif Dockerfile

# Lint from stdin
cat Dockerfile | hadolint -

# Lint docker-compose referenced Dockerfiles
hadolint */Dockerfile
```

### Configuration (.hadolint.yaml)

```yaml
# .hadolint.yaml
ignored:
  - DL3008  # Pin versions in apt-get
  - DL3009  # Delete apt lists

trustedRegistries:
  - docker.io
  - gcr.io
  - ghcr.io

override:
  error:
    - DL3001  # Invalid command
    - DL3002  # Last USER should not be root
  warning:
    - DL3042  # Avoid cache directory with pip
  info:
    - DL3032  # yum clean all
  style:
    - DL3015  # Avoid additional packages

failure-threshold: warning
```

### Common Rules

```dockerfile
# DL3006 - Always tag base image
FROM ubuntu:24.04  # Good
FROM ubuntu        # Bad

# DL3007 - Using latest is prone to errors
FROM ubuntu:24.04  # Good
FROM ubuntu:latest # Bad

# DL3008 - Pin versions in apt-get install
RUN apt-get update && apt-get install -y \
    nginx=1.24.0-1ubuntu1  # Good

# DL3009 - Delete apt-get lists
RUN apt-get update && apt-get install -y nginx \
    && rm -rf /var/lib/apt/lists/*  # Good

# DL3013 - Pin pip versions
RUN pip install requests==2.31.0  # Good
RUN pip install requests          # Bad

# DL3018 - Pin apk versions
RUN apk add --no-cache nginx=1.24.0-r0  # Good

# DL3025 - Use JSON form for CMD/ENTRYPOINT
CMD ["nginx", "-g", "daemon off;"]  # Good
CMD nginx -g daemon off;            # Bad

# DL4006 - Set SHELL to pipefail
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN curl ... | tar xz  # Now safe
```

## container-structure-test

### Installation

```bash
curl -LO https://github.com/GoogleContainerTools/container-structure-test/releases/latest/download/container-structure-test-linux-amd64
chmod +x container-structure-test-linux-amd64
sudo mv container-structure-test-linux-amd64 /usr/local/bin/container-structure-test
```

### Test Configuration

```yaml
# structure-test.yaml
schemaVersion: 2.0.0

# Test commands work correctly
commandTests:
  - name: "Python version"
    command: "python"
    args: ["--version"]
    expectedOutput: ["Python 3.12"]
  
  - name: "App starts without error"
    command: "/app/start.sh"
    args: ["--check"]
    exitCode: 0
  
  - name: "nginx config test"
    command: "nginx"
    args: ["-t"]
    exitCode: 0
    expectedError: ["syntax is ok"]

# Test files exist with correct properties
fileExistenceTests:
  - name: "App binary exists"
    path: "/app/myapp"
    shouldExist: true
    permissions: "-rwxr-xr-x"
  
  - name: "Config file exists"
    path: "/etc/app/config.yaml"
    shouldExist: true
    permissions: "-rw-r--r--"
    uid: 1000
    gid: 1000
  
  - name: "No shell history"
    path: "/root/.bash_history"
    shouldExist: false

# Test file contents
fileContentTests:
  - name: "Config has correct database"
    path: "/etc/app/config.yaml"
    expectedContents: ["database: postgresql"]
  
  - name: "No hardcoded secrets"
    path: "/etc/app/config.yaml"
    excludedContents: ["password:", "secret:"]

# Test image metadata
metadataTest:
  user: "appuser"
  exposedPorts: ["8080", "8443"]
  volumes: ["/data"]
  entrypoint: ["/app/entrypoint.sh"]
  cmd: ["serve"]
  workdir: "/app"
  envVars:
    - key: "APP_ENV"
      value: "production"
    - key: "PATH"
      isRegex: true
      value: ".*/app/bin.*"
  labels:
    - key: "org.opencontainers.image.source"
      value: "https://github.com/myorg/myapp"

# Test licenses (avoid GPL in proprietary)
licenseTests:
  - debian: true
    files: ["/usr/share/doc/*/copyright"]
    excludedLicenses: ["AGPL-3"]
```

### Running Tests

```bash
# Test local image
container-structure-test test --image myapp:latest --config structure-test.yaml

# Test remote image
container-structure-test test --image gcr.io/project/myapp:v1.0 --config structure-test.yaml

# Multiple config files
container-structure-test test --image myapp:latest \
  --config base-tests.yaml \
  --config app-tests.yaml

# Output formats
container-structure-test test --image myapp:latest --config structure-test.yaml --output json

# Pull before test
container-structure-test test --pull --image myapp:latest --config structure-test.yaml
```

## Docker Compose Testing

### Validate Configuration

```bash
# Validate compose file syntax
docker compose config

# Validate and show resolved config
docker compose config --quiet

# Check specific file
docker compose -f docker-compose.prod.yml config
```

### Test Services Start

```bash
#!/bin/bash
# test-compose.sh

set -e

echo "Starting services..."
docker compose up -d

echo "Waiting for services to be healthy..."
timeout 60 bash -c 'until docker compose ps | grep -q "healthy"; do sleep 2; done'

echo "Running health checks..."
# Test web service
curl -f http://localhost:8080/health || exit 1

# Test database is accessible
docker compose exec -T db pg_isready || exit 1

echo "All services healthy"

# Cleanup
docker compose down -v
```

### Integration Test Pattern

```yaml
# docker-compose.test.yml
services:
  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://test:test@db:5432/testdb
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 5s
      timeout: 3s
      retries: 5

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: testdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 3s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    depends_on:
      app:
        condition: service_healthy
    command: pytest tests/integration/
```

## trivy (Security Scanning)

### Installation

```bash
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
```

### Usage

```bash
# Scan image for vulnerabilities
trivy image myapp:latest

# Scan with specific severity
trivy image --severity HIGH,CRITICAL myapp:latest

# Scan Dockerfile for misconfigurations
trivy config Dockerfile

# Scan with exit code for CI
trivy image --exit-code 1 --severity CRITICAL myapp:latest

# Output formats
trivy image --format json --output results.json myapp:latest
trivy image --format sarif myapp:latest
```

## CI Integration

```yaml
# .github/workflows/docker.yml
name: Docker Tests
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile

  build-and-test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:test .

      - name: Run structure tests
        run: |
          curl -LO https://github.com/GoogleContainerTools/container-structure-test/releases/latest/download/container-structure-test-linux-amd64
          chmod +x container-structure-test-linux-amd64
          ./container-structure-test-linux-amd64 test --image myapp:test --config structure-test.yaml

      - name: Security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:test
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

## Complete Test Script

```bash
#!/bin/bash
# test-docker.sh

set -e

IMAGE_NAME="${1:-myapp:test}"

echo "=== Linting Dockerfile ==="
hadolint Dockerfile

echo ""
echo "=== Building Image ==="
docker build -t "$IMAGE_NAME" .

echo ""
echo "=== Structure Tests ==="
container-structure-test test --image "$IMAGE_NAME" --config structure-test.yaml

echo ""
echo "=== Security Scan ==="
trivy image --severity HIGH,CRITICAL --exit-code 0 "$IMAGE_NAME"

echo ""
echo "=== Compose Validation ==="
docker compose config --quiet

echo ""
echo "✓ All Docker tests passed"
```
