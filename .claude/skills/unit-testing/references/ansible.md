# Ansible Testing with Molecule and ansible-lint

## When to Use Each Tool

| Tool | Use Case | Speed |
|------|----------|-------|
| **ansible-lint** | Syntax, style, best practices | Fast (seconds) |
| **--check mode** | Dry-run to preview changes | Medium |
| **Molecule** | Full integration testing with containers | Slow (minutes) |

**Recommendation:**
- Always: ansible-lint in CI
- For roles: Molecule
- For playbooks: --check mode + selective Molecule tests

## ansible-lint

### Installation

```bash
pip install ansible-lint
```

### Configuration (.ansible-lint)

```yaml
---
profile: production  # null, basic, moderate, safety, shared, production

exclude_paths:
  - .cache/
  - .github/
  - molecule/

skip_list:
  - yaml[line-length]

warn_list:
  - experimental

enable_list:
  - args
  - empty-string-compare
  - no-log-password
  - no-same-owner
```

### Running

```bash
# Lint all
ansible-lint

# Specific file
ansible-lint playbook.yml

# Specific rules
ansible-lint -t yaml

# List rules
ansible-lint -L

# Auto-fix (where possible)
ansible-lint --fix
```

### Common Rules to Know

```yaml
# name[missing] - Tasks should have names
- name: Install packages  # Good
  ansible.builtin.apt:
    name: nginx

# fqcn[action-core] - Use fully qualified collection names
- ansible.builtin.apt:  # Good, not just "apt"
    name: nginx

# yaml[truthy] - Use true/false, not yes/no
  become: true  # Good

# no-changed-when - Command tasks need changed_when
- name: Check status
  ansible.builtin.command: systemctl status nginx
  changed_when: false

# risky-shell-pipe - Use pipefail
- name: Count processes
  ansible.builtin.shell: |
    set -o pipefail
    ps aux | grep nginx | wc -l
  args:
    executable: /bin/bash
```

## Molecule

### Installation

```bash
pip install molecule molecule-plugins[docker]
```

### Initialize Role with Molecule

```bash
molecule init role my_role
# Or add to existing role
cd existing_role
molecule init scenario -d docker
```

### Directory Structure

```
my_role/
├── defaults/
├── handlers/
├── tasks/
├── templates/
├── molecule/
│   └── default/
│       ├── molecule.yml      # Scenario configuration
│       ├── converge.yml      # Apply role
│       ├── verify.yml        # Assertions
│       ├── prepare.yml       # Pre-test setup (optional)
│       └── cleanup.yml       # Post-test cleanup (optional)
└── meta/
```

### molecule.yml

```yaml
---
dependency:
  name: galaxy
  options:
    requirements-file: requirements.yml

driver:
  name: docker

platforms:
  - name: instance
    image: geerlingguy/docker-ubuntu2404-ansible
    pre_build_image: true
    privileged: true
    command: /lib/systemd/systemd
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:rw
    cgroupns_mode: host

provisioner:
  name: ansible
  playbooks:
    converge: converge.yml
    verify: verify.yml
  inventory:
    host_vars:
      instance:
        my_var: test_value

verifier:
  name: ansible
```

### converge.yml

```yaml
---
- name: Converge
  hosts: all
  become: true
  vars:
    # Override defaults for testing
    my_role_option: test_value
  roles:
    - role: my_role
```

### verify.yml (Assertions)

```yaml
---
- name: Verify
  hosts: all
  become: true
  gather_facts: true
  tasks:
    - name: Check service is running
      ansible.builtin.service_facts:

    - name: Assert nginx is running
      ansible.builtin.assert:
        that:
          - ansible_facts.services['nginx.service'].state == 'running'
        fail_msg: "nginx should be running"
        success_msg: "nginx is running"

    - name: Check config file exists
      ansible.builtin.stat:
        path: /etc/nginx/nginx.conf
      register: nginx_conf

    - name: Assert config exists
      ansible.builtin.assert:
        that:
          - nginx_conf.stat.exists
          - nginx_conf.stat.mode == '0644'

    - name: Check port is listening
      ansible.builtin.wait_for:
        port: 80
        timeout: 5

    - name: Test HTTP response
      ansible.builtin.uri:
        url: http://localhost/
        status_code: 200
      register: http_result

    - name: Assert HTTP response
      ansible.builtin.assert:
        that:
          - http_result.status == 200
```

### Running Molecule

```bash
# Full test sequence
molecule test

# Individual steps
molecule create      # Create containers
molecule converge    # Run playbook
molecule verify      # Run assertions
molecule destroy     # Cleanup

# Keep container after test (for debugging)
molecule converge
molecule login       # SSH into container

# Specific scenario
molecule test -s scenario_name

# Debug mode
molecule --debug test
```

### Multiple Scenarios

```
molecule/
├── default/         # Standard test
├── centos/          # CentOS-specific
└── upgrade/         # Upgrade path test
```

### Testing with Multiple Platforms

```yaml
# molecule.yml
platforms:
  - name: ubuntu2404
    image: geerlingguy/docker-ubuntu2404-ansible
    pre_build_image: true

  - name: debian12
    image: geerlingguy/docker-debian12-ansible
    pre_build_image: true

  - name: rocky9
    image: geerlingguy/docker-rockylinux9-ansible
    pre_build_image: true
```

### verify.yml Patterns

```yaml
# Check file content
- name: Read config file
  ansible.builtin.slurp:
    src: /etc/app/config.yml
  register: config_content

- name: Assert config contains expected values
  ansible.builtin.assert:
    that:
      - "'database: postgresql' in (config_content.content | b64decode)"

# Check command output
- name: Get version
  ansible.builtin.command: app --version
  register: version_output
  changed_when: false

- name: Assert correct version
  ansible.builtin.assert:
    that:
      - "'2.0' in version_output.stdout"

# Check users/groups exist
- name: Get user info
  ansible.builtin.getent:
    database: passwd
    key: appuser
  register: user_info

- name: Assert user exists
  ansible.builtin.assert:
    that:
      - user_info is not failed
```

## CI Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run ansible-lint
        uses: ansible/ansible-lint@main

  molecule:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install molecule molecule-plugins[docker] ansible
      - name: Run Molecule
        run: molecule test
```
