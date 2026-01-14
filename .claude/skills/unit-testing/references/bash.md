# Bash Testing with bats-core

## Installation

```bash
# Ubuntu/Debian
sudo apt-get install bats

# Or from source
git clone https://github.com/bats-core/bats-core.git
cd bats-core
./install.sh /usr/local

# Install helper libraries
git clone https://github.com/bats-core/bats-support.git test/test_helper/bats-support
git clone https://github.com/bats-core/bats-assert.git test/test_helper/bats-assert
git clone https://github.com/bats-core/bats-file.git test/test_helper/bats-file
```

## File Organization

```
project/
├── bin/
│   └── my_script.sh
├── lib/
│   └── functions.sh
└── test/
    ├── test_helper/
    │   ├── bats-support/
    │   ├── bats-assert/
    │   └── bats-file/
    ├── setup_suite.bash
    ├── my_script.bats
    └── functions.bats
```

## Basic Test Structure

```bash
#!/usr/bin/env bats

# Load helpers
load 'test_helper/bats-support/load'
load 'test_helper/bats-assert/load'

# Setup for all tests in file
setup() {
    # Source script being tested
    source "${BATS_TEST_DIRNAME}/../lib/functions.sh"
    
    # Create temp directory
    TEST_TEMP_DIR="$(mktemp -d)"
}

# Teardown after each test
teardown() {
    rm -rf "$TEST_TEMP_DIR"
}

@test "add function returns sum of two numbers" {
    result=$(add 2 3)
    assert_equal "$result" "5"
}

@test "add function handles negative numbers" {
    result=$(add -2 3)
    assert_equal "$result" "1"
}

@test "divide function returns error for zero divisor" {
    run divide 10 0
    assert_failure
    assert_output --partial "division by zero"
}
```

## Testing Scripts (not functions)

```bash
@test "script exits successfully with valid input" {
    run "${BATS_TEST_DIRNAME}/../bin/my_script.sh" --input "valid"
    assert_success
}

@test "script prints usage with --help" {
    run "${BATS_TEST_DIRNAME}/../bin/my_script.sh" --help
    assert_success
    assert_output --partial "Usage:"
}

@test "script exits with error for missing argument" {
    run "${BATS_TEST_DIRNAME}/../bin/my_script.sh"
    assert_failure
    assert_output --partial "Error: missing required argument"
}

@test "script processes file correctly" {
    echo "test data" > "${TEST_TEMP_DIR}/input.txt"
    
    run "${BATS_TEST_DIRNAME}/../bin/my_script.sh" "${TEST_TEMP_DIR}/input.txt"
    
    assert_success
    assert_output "processed: test data"
}
```

## Assertions (bats-assert)

```bash
# Exit status
assert_success                    # Exit code 0
assert_failure                    # Exit code non-zero
assert_failure 2                  # Specific exit code

# Output matching
assert_output "exact match"       # Exact match
assert_output --partial "substr"  # Contains substring
assert_output --regexp "^Start.*End$"  # Regex match
refute_output                     # No output
refute_output --partial "error"   # Doesn't contain

# Line-by-line matching
assert_line "exact line"
assert_line --index 0 "first line"
assert_line --partial "contains"
refute_line "should not exist"

# Variable assertions
assert_equal "$actual" "$expected"
refute_equal "$actual" "$unexpected"
```

## File Assertions (bats-file)

```bash
load 'test_helper/bats-file/load'

@test "script creates output file" {
    run "${BATS_TEST_DIRNAME}/../bin/my_script.sh" --output "${TEST_TEMP_DIR}/out.txt"
    
    assert_file_exists "${TEST_TEMP_DIR}/out.txt"
    assert_file_not_empty "${TEST_TEMP_DIR}/out.txt"
    assert_file_contains "${TEST_TEMP_DIR}/out.txt" "expected content"
}

@test "script creates directory structure" {
    run "${BATS_TEST_DIRNAME}/../bin/setup.sh" "${TEST_TEMP_DIR}"
    
    assert_dir_exists "${TEST_TEMP_DIR}/config"
    assert_file_exists "${TEST_TEMP_DIR}/config/settings.conf"
    assert_file_permission 755 "${TEST_TEMP_DIR}/bin/run.sh"
}

# More file assertions
assert_file_empty "$file"
assert_file_owner "root" "$file"
assert_file_group "www-data" "$file"
assert_symlink_to "/target" "$link"
```

## Mocking Commands

```bash
@test "script calls curl with correct URL" {
    # Create mock curl
    curl() {
        echo "mock response"
        echo "$@" > "${TEST_TEMP_DIR}/curl_args"
    }
    export -f curl
    
    run "${BATS_TEST_DIRNAME}/../bin/fetch_data.sh"
    
    assert_success
    assert_file_contains "${TEST_TEMP_DIR}/curl_args" "https://api.example.com"
}

@test "handles command failure gracefully" {
    # Mock failing command
    external_command() {
        return 1
    }
    export -f external_command
    
    run "${BATS_TEST_DIRNAME}/../bin/my_script.sh"
    
    assert_failure
    assert_output --partial "external command failed"
}
```

## Setup and Teardown

```bash
# Runs once before all tests in a file
setup_file() {
    export TEST_DB="$(mktemp -d)/test.db"
    create_test_database "$TEST_DB"
}

# Runs once after all tests in a file
teardown_file() {
    rm -rf "$(dirname "$TEST_DB")"
}

# Runs before each test
setup() {
    load 'test_helper/bats-support/load'
    load 'test_helper/bats-assert/load'
}

# Runs after each test
teardown() {
    # Cleanup test-specific resources
}
```

## Skipping Tests

```bash
@test "requires database connection" {
    if ! command -v psql &> /dev/null; then
        skip "psql not installed"
    fi
    
    run check_database_connection
    assert_success
}

@test "slow integration test" {
    if [[ -n "${SKIP_SLOW_TESTS:-}" ]]; then
        skip "skipping slow tests"
    fi
    
    run long_running_operation
    assert_success
}
```

## Testing with Environment Variables

```bash
@test "uses default value when env var not set" {
    unset MY_CONFIG
    
    run "${BATS_TEST_DIRNAME}/../bin/my_script.sh"
    
    assert_success
    assert_output --partial "using default config"
}

@test "uses custom config when env var set" {
    export MY_CONFIG="/custom/path"
    
    run "${BATS_TEST_DIRNAME}/../bin/my_script.sh"
    
    assert_success
    assert_output --partial "using /custom/path"
}
```

## Testing Interactive Input

```bash
@test "handles user input" {
    run bash -c 'echo "yes" | "${BATS_TEST_DIRNAME}/../bin/interactive.sh"'
    
    assert_success
    assert_output --partial "Confirmed"
}

@test "handles multiple prompts" {
    run bash -c 'printf "user\npassword\n" | "${BATS_TEST_DIRNAME}/../bin/setup.sh"'
    
    assert_success
}
```

## Running Tests

```bash
# Run all tests
bats test/

# Run specific file
bats test/my_script.bats

# Verbose output
bats --verbose-run test/

# TAP output
bats --tap test/

# Run in parallel
bats --jobs 4 test/

# Filter tests by name
bats --filter "handles error" test/

# Show timing
bats --timing test/
```

## Linting with shellcheck

```bash
# Check all shell scripts
shellcheck bin/*.sh lib/*.sh

# Integrate with tests
@test "scripts pass shellcheck" {
    run shellcheck "${BATS_TEST_DIRNAME}/../bin/my_script.sh"
    assert_success
}
```
