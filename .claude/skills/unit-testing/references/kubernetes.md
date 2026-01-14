# Kubernetes/Kustomize Testing

## Testing Tools Overview

| Tool | Purpose | Use Case |
|------|---------|----------|
| **kubeconform** | Schema validation | Validate YAML against K8s schemas |
| **kustomize build** | Render validation | Ensure kustomizations render |
| **conftest** | Policy testing | Custom rules with Rego |
| **kubeval** | Schema validation | Legacy, prefer kubeconform |
| **pluto** | Deprecation checks | Find deprecated APIs |

## kubeconform

### Installation

```bash
# Binary
curl -sL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar xz
sudo mv kubeconform /usr/local/bin/

# Or via Go
go install github.com/yannh/kubeconform/cmd/kubeconform@latest
```

### Basic Usage

```bash
# Validate single file
kubeconform deployment.yaml

# Validate directory
kubeconform -summary manifests/

# Validate kustomize output
kustomize build ./overlays/prod | kubeconform -summary

# Specific Kubernetes version
kubeconform -kubernetes-version 1.29.0 manifests/

# Strict mode (fail on unknown fields)
kubeconform -strict manifests/

# With CRD schemas
kubeconform -schema-location default \
  -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
  manifests/
```

### Configuration File (.kubeconform)

```yaml
# .kubeconform.yaml
kubernetes-version: "1.29.0"
strict: true
summary: true
output: text
schema-location:
  - default
  - 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json'
ignore-missing-schemas: false
skip:
  - CustomResourceDefinition  # Skip CRDs themselves
```

## Kustomize Validation

### Validate Builds

```bash
# Basic build test (should not error)
kustomize build ./base
kustomize build ./overlays/dev
kustomize build ./overlays/prod

# Pipe to kubeconform
kustomize build ./overlays/prod | kubeconform -strict -summary

# Diff between environments
diff <(kustomize build ./overlays/dev) <(kustomize build ./overlays/prod)
```

### Test Script

```bash
#!/bin/bash
# test-kustomize.sh

set -e

OVERLAYS=("dev" "staging" "prod")

for overlay in "${OVERLAYS[@]}"; do
    echo "Testing overlay: $overlay"
    
    # Build should succeed
    kustomize build "./overlays/$overlay" > /dev/null
    
    # Validate output
    kustomize build "./overlays/$overlay" | kubeconform -strict -summary
    
    echo "✓ $overlay passed"
done

echo "All overlays validated successfully"
```

## conftest (Policy Testing)

### Installation

```bash
# Binary
curl -sL https://github.com/open-policy-agent/conftest/releases/latest/download/conftest_*_Linux_x86_64.tar.gz | tar xz
sudo mv conftest /usr/local/bin/

# Or via Go
go install github.com/open-policy-agent/conftest@latest
```

### Directory Structure

```
project/
├── manifests/
│   └── deployment.yaml
├── policy/
│   ├── deployment.rego
│   ├── security.rego
│   └── labels.rego
└── conftest.toml
```

### Policy Examples

```rego
# policy/deployment.rego
package main

import future.keywords.if
import future.keywords.in

# Deny deployments without resource limits
deny[msg] if {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.resources.limits
    msg := sprintf("Container '%s' must have resource limits", [container.name])
}

# Deny deployments without resource requests
deny[msg] if {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.resources.requests
    msg := sprintf("Container '%s' must have resource requests", [container.name])
}

# Require minimum replicas
deny[msg] if {
    input.kind == "Deployment"
    input.spec.replicas < 2
    msg := "Deployments must have at least 2 replicas"
}
```

```rego
# policy/security.rego
package main

import future.keywords.if

# Deny privileged containers
deny[msg] if {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    container.securityContext.privileged == true
    msg := sprintf("Container '%s' must not be privileged", [container.name])
}

# Deny running as root
deny[msg] if {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    container.securityContext.runAsNonRoot != true
    msg := sprintf("Container '%s' must set runAsNonRoot: true", [container.name])
}

# Require read-only root filesystem
warn[msg] if {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.securityContext.readOnlyRootFilesystem
    msg := sprintf("Container '%s' should have readOnlyRootFilesystem", [container.name])
}

# Deny latest tag
deny[msg] if {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    endswith(container.image, ":latest")
    msg := sprintf("Container '%s' must not use :latest tag", [container.name])
}

deny[msg] if {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not contains(container.image, ":")
    msg := sprintf("Container '%s' must specify image tag", [container.name])
}
```

```rego
# policy/labels.rego
package main

import future.keywords.if

required_labels := {"app", "environment", "team"}

# Require standard labels
deny[msg] if {
    input.kind == "Deployment"
    provided := {label | input.metadata.labels[label]}
    missing := required_labels - provided
    count(missing) > 0
    msg := sprintf("Deployment missing required labels: %v", [missing])
}
```

### Running conftest

```bash
# Test single file
conftest test deployment.yaml

# Test directory
conftest test manifests/

# Test kustomize output
kustomize build ./overlays/prod | conftest test -

# Specific policy directory
conftest test -p ./policy manifests/

# Output formats
conftest test --output json manifests/
conftest test --output tap manifests/

# Combine namespaces
conftest test --all-namespaces manifests/
```

### conftest.toml

```toml
# conftest.toml
policy = "policy"
namespace = "main"
```

## pluto (Deprecation Detection)

### Installation

```bash
curl -sL https://github.com/FairwindsOps/pluto/releases/latest/download/pluto_*_linux_amd64.tar.gz | tar xz
sudo mv pluto /usr/local/bin/
```

### Usage

```bash
# Check files
pluto detect-files -d manifests/

# Check kustomize
kustomize build ./overlays/prod | pluto detect -

# Target specific K8s version
pluto detect-files -d manifests/ --target-versions k8s=v1.29.0

# Check Helm releases in cluster
pluto detect-helm
```

## CI Integration

```yaml
# .github/workflows/validate.yml
name: Validate Kubernetes Manifests
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install tools
        run: |
          # kubeconform
          curl -sL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar xz
          sudo mv kubeconform /usr/local/bin/
          
          # conftest
          curl -sL https://github.com/open-policy-agent/conftest/releases/latest/download/conftest_*_Linux_x86_64.tar.gz | tar xz
          sudo mv conftest /usr/local/bin/
          
          # kustomize
          curl -sL https://github.com/kubernetes-sigs/kustomize/releases/latest/download/kustomize_*_linux_amd64.tar.gz | tar xz
          sudo mv kustomize /usr/local/bin/

      - name: Validate schemas
        run: |
          for overlay in overlays/*/; do
            echo "Validating $overlay"
            kustomize build "$overlay" | kubeconform -strict -summary
          done

      - name: Run policy tests
        run: |
          for overlay in overlays/*/; do
            echo "Testing policies for $overlay"
            kustomize build "$overlay" | conftest test -
          done
```

## Complete Test Script

```bash
#!/bin/bash
# test-k8s-manifests.sh

set -e

echo "=== Schema Validation ==="
for overlay in overlays/*/; do
    echo "Validating: $overlay"
    kustomize build "$overlay" | kubeconform -strict -summary -kubernetes-version 1.29.0
done

echo ""
echo "=== Policy Tests ==="
for overlay in overlays/*/; do
    echo "Testing: $overlay"
    kustomize build "$overlay" | conftest test -p policy -
done

echo ""
echo "=== Deprecation Check ==="
for overlay in overlays/*/; do
    echo "Checking: $overlay"
    kustomize build "$overlay" | pluto detect - --target-versions k8s=v1.29.0
done

echo ""
echo "✓ All validations passed"
```
